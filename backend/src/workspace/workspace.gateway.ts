import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { JoinUserDTO } from './dto/join-user.dto';
import { LeaveUserDTO } from './dto/left-user.dto';
import { MoveCursorDTO } from './dto/move-cursor.dto';
import { UserStatus } from './dto/user-status.dto';
import { WorkspaceService } from './workspace.service';
import { CursorService } from '../cursor/cursor.service';
import { SetCursorDTO } from '../cursor/dto/set-cursor.dto';
import { UpdateCursorDTO } from '../cursor/dto/update-cursor.dto';

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction ? process.env.HOST_URL : '*';

@WebSocketGateway({
  namespace: 'workspace',
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
export class WorkspaceGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly cursorService: CursorService,
  ) {}

  handleDisconnect(client: Socket) {
    const result = this.workspaceService.handleDisconnect(client.id);
    if (!result) {
      return;
    }
    const { roomId, userId } = result;

    // 커서 정보 정리
    this.cursorService.removeCursor(roomId, userId);

    this.server.to(roomId).emit('user:status', {
      userId,
      status: UserStatus.OFFLINE,
    });
    this.server.to(roomId).emit('user:left', userId);
  }

  /* 
  워크 스페이스 처음 접속 시 정보를 전달해줘야 함
  1. 위젯 데이터
  2. 유저 관련 정보
  */
  @SubscribeMessage('user:join')
  async handleUserJoin(
    @MessageBody() payload: JoinUserDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, user, allUsers } = this.workspaceService.joinUser(
      payload,
      client.id,
    );

    await client.join(roomId);

    this.cursorService.setCursor({
      workspaceId: roomId,
      userId: user.id,
      // 아예 처음에 안보이게 하기...
      x: 10000,
      y: 10000,
    } as SetCursorDTO);

    // 현재 워크스페이스의 커서 상태도 함께 내려줄 수 있도록 확장 여지 확보
    const cursors = this.cursorService.getCursorsByWorkspace(roomId);

    this.server.to(roomId).emit('user:status', {
      userId: user.id,
      status: UserStatus.ONLINE,
    });

    // 같은 workspace(room)에 있는 전체 유저 + 커서 목록 전달
    this.server.to(roomId).emit('user:joined', {
      allUsers,
      cursors,
    });
  }

  @SubscribeMessage('user:leave')
  async handleUserLeave(
    @MessageBody() payload: LeaveUserDTO,
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.workspaceService.leaveUser(client.id);
    if (!result) {
      return;
    }
    const { roomId, userId } = result;

    // 커서 정보 정리
    this.cursorService.removeCursor(roomId, userId);

    await client.leave(roomId);

    this.server.to(roomId).emit('user:status', {
      userId,
      status: UserStatus.OFFLINE,
    });
    this.server.to(roomId).emit('user:left', userId);
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MoveCursorDTO,
  ) {
    const userInfo = this.workspaceService.getUserBySocketId(client.id);
    if (!userInfo) {
      return;
    }

    const { roomId } = userInfo;

    this.cursorService.updateCursor({
      workspaceId: roomId,
      userId: payload.userId,
      x: payload.moveData.x,
      y: payload.moveData.y,
    } as UpdateCursorDTO);

    // 동일 room에 브로드캐스트
    this.server.to(roomId).emit('cursor:moved', payload);
  }
}
