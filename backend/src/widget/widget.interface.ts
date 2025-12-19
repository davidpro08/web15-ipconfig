import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';

export interface IWidgetService {
  create(
    workspaceId: string,
    createWidgetDto: CreateWidgetDto,
  ): Promise<CreateWidgetDto>;
  findAll(workspaceId: string): Promise<CreateWidgetDto[]>;
  findOne(workspaceId: string, widgetId: string): Promise<CreateWidgetDto>;
  update(
    workspaceId: string,
    updateWidgetDto: UpdateWidgetDto,
  ): Promise<CreateWidgetDto>;
  remove(workspaceId: string, widgetId: string): Promise<{ widgetId: string }>;
}

export const WIDGET_SERVICE = 'WIDGET_SERVICE';
