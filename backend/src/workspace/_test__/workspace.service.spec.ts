import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceService } from '../workspace.service';
import { JoinUserDTO } from '../dto/join-user.dto';
import { LeaveUserDTO } from '../dto/left-user.dto';
import { Socket } from 'socket.io';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceService],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  it('서비스 인스턴스 생성', () => {
    expect(service).toBeDefined();
  });

  describe('joinUser', () => {
    it('payload로부터 roomId/user를 만들고 socket.data에 저장한다', () => {
      // GIVEN
      const payload: JoinUserDTO = {
        workspaceId: 'w1',
        user: { id: 'u1', nickname: 'user1', color: '#000000' },
      };
      const client = { id: 's1', data: {} } as unknown as Socket;

      // WHEN
      const result = service.joinUser(payload, client);

      // THEN
      expect(result).toEqual({
        roomId: 'w1',
        user: payload.user,
      });
      expect(client.data).toEqual({ roomId: 'w1', userId: 'u1' });
    });
  });

  describe('leaveUser', () => {
    it('roomId/userId를 반환하고 socket.data를 초기화한다', () => {
      // GIVEN
      const client = {
        id: 's1',
        data: { roomId: 'w1', userId: 'u1' },
      } as unknown as Socket;
      const leavePayload: LeaveUserDTO = { workspaceId: 'w1', userId: 'u1' };

      // WHEN
      const result = service.leaveUser(leavePayload, client);

      // THEN
      expect(result).toEqual({ roomId: 'w1', userId: 'u1' });
      expect(client.data).toEqual({});
    });
  });

  describe('handleDisconnect', () => {
    it('socket.data에 roomId/userId가 없으면 null을 반환한다', () => {
      // GIVEN
      const client = { id: 's1', data: {} } as unknown as Socket;

      // WHEN
      const result = service.handleDisconnect(client);

      // THEN
      expect(result).toBeNull();
    });

    it('socket.data에 roomId/userId가 있으면 반환하고 socket.data를 초기화한다', () => {
      // GIVEN
      const client = {
        id: 's1',
        data: { roomId: 'w1', userId: 'u1' },
      } as unknown as Socket;

      // WHEN
      const result = service.handleDisconnect(client);

      // THEN
      expect(result).toEqual({ roomId: 'w1', userId: 'u1' });
      expect(client.data).toEqual({});
    });
  });
});
