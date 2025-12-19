import { Injectable, NotFoundException } from '@nestjs/common';
import { IWidgetService } from './widget.interface';
import { CreateWidgetDto } from './dto/create-widget.dto';
import { UpdateWidgetDto } from './dto/update-widget.dto';

@Injectable()
export class WidgetMemoryService implements IWidgetService {
  private readonly workspaces = new Map<string, Map<string, CreateWidgetDto>>();

  private getWidgetsMap(workspaceId: string): Map<string, CreateWidgetDto> {
    if (!this.workspaces.has(workspaceId)) {
      this.workspaces.set(workspaceId, new Map());
    }
    return this.workspaces.get(workspaceId)!;
  }

  async create(
    workspaceId: string,
    createWidgetDto: CreateWidgetDto,
  ): Promise<CreateWidgetDto> {
    const widgets = this.getWidgetsMap(workspaceId);
    widgets.set(createWidgetDto.widgetId, createWidgetDto);
    return Promise.resolve(createWidgetDto);
  }

  async findAll(workspaceId: string): Promise<CreateWidgetDto[]> {
    const widgets = this.getWidgetsMap(workspaceId);
    return Promise.resolve(Array.from(widgets.values()));
  }

  async findOne(
    workspaceId: string,
    widgetId: string,
  ): Promise<CreateWidgetDto> {
    const widgets = this.getWidgetsMap(workspaceId);
    const widget = widgets.get(widgetId);
    if (!widget) {
      throw new NotFoundException(`Widget with ID ${widgetId} not found`);
    }
    return Promise.resolve(widget);
  }

  async update(
    workspaceId: string,
    updateWidgetDto: UpdateWidgetDto,
  ): Promise<CreateWidgetDto> {
    const widgets = this.getWidgetsMap(workspaceId);
    const existingWidget = widgets.get(updateWidgetDto.widgetId);

    if (!existingWidget) {
      throw new NotFoundException(
        `Widget with ID ${updateWidgetDto.widgetId} not found`,
      );
    }

    const updatedWidget = {
      ...existingWidget,
      data: {
        ...existingWidget.data,
        ...updateWidgetDto.data,
        content: updateWidgetDto.data.content
          ? {
              ...existingWidget.data.content,
              ...updateWidgetDto.data.content,
            }
          : existingWidget.data.content,
      },
    } as CreateWidgetDto;

    widgets.set(updateWidgetDto.widgetId, updatedWidget);
    return Promise.resolve(updatedWidget);
  }

  async remove(
    workspaceId: string,
    widgetId: string,
  ): Promise<{ widgetId: string }> {
    const widgets = this.getWidgetsMap(workspaceId);
    if (!widgets.has(widgetId)) {
      throw new NotFoundException(`Widget with ID ${widgetId} not found`);
    }
    widgets.delete(widgetId);
    return Promise.resolve({ widgetId });
  }
}
