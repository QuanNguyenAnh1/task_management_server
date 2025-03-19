import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Delete, 
    UseGuards, 
    Request, 
    NotFoundException, 
    ForbiddenException,
    BadRequestException,
    Patch,
    Query
  } from '@nestjs/common';
  import { TasksService } from './tasks.service';
  import { JwtAuthGuard } from 'src/auth/jws.guard';
  import { CreateTaskDto } from './dto/create-task.dto';
  import { UpdateTaskDto } from './dto/update-task.dto';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth, 
    ApiParam, 
    ApiQuery, 
    ApiBody 
  } from '@nestjs/swagger';
  
  @ApiTags('tasks')
  @ApiBearerAuth()
  @Controller('tasks')
  @UseGuards(JwtAuthGuard)
  export class TasksController {
    constructor(private tasksService: TasksService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get all tasks for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Return all tasks for the user' })
    @ApiQuery({ name: 'year', required: false, type: Number })
    @ApiQuery({ name: 'month', required: false, type: Number })
    @ApiQuery({ name: 'day', required: false, type: Number })
    @ApiQuery({ name: 'mode', required: false, enum: ['day', 'month', 'year'] })
    async findAll(
      @Request() req,
      @Query('year') year?: number,
      @Query('month') month?: number,
      @Query('day') day?: number,
      @Query('mode') mode?: 'day' | 'month' | 'year',
    ) {
      return this.tasksService.findAllByUser(req.user.id, { 
        year, 
        month, 
        day, 
        mode: mode || 'day' 
      });
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a task by ID' })
    @ApiResponse({ status: 200, description: 'Return the task' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiParam({ name: 'id', type: 'number' })
    async findOne(@Param('id') id: string, @Request() req) {
      const task = await this.tasksService.findOne(+id);
      
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      
      if (task.userId !== req.user.id) {
        throw new ForbiddenException('You do not have permission to access this task');
      }
      
      return task;
    }
  
    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    @ApiResponse({ status: 201, description: 'The task has been successfully created' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiBody({ type: CreateTaskDto })
    async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
      try {
        if (typeof createTaskDto.title === 'string') {
          createTaskDto.title = createTaskDto.title.trim();
        }
        
        if (typeof createTaskDto.description === 'string') {
          createTaskDto.description = createTaskDto.description.trim();
        }
        
        if (!createTaskDto.title) {
          throw new BadRequestException('Title is required');
        }
        
        return await this.tasksService.create(createTaskDto, req.user.id);
      } catch (error) {
        console.error('Error creating task:', error);
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Failed to create task: ' + error.message);
      }
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update a task' })
    @ApiResponse({ status: 200, description: 'The task has been successfully updated' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiParam({ name: 'id', type: 'number' })
    @ApiBody({ type: UpdateTaskDto })
    async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
      const task = await this.tasksService.findOne(+id);
      
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      
      if (task.userId !== req.user.id) {
        throw new ForbiddenException('You do not have permission to update this task');
      }
      
      return this.tasksService.update(+id, updateTaskDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a task' })
    @ApiResponse({ status: 200, description: 'The task has been successfully deleted' })
    @ApiResponse({ status: 404, description: 'Task not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiParam({ name: 'id', type: 'number' })
    async remove(@Param('id') id: string, @Request() req) {
      const task = await this.tasksService.findOne(+id);
      
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      
      if (task.userId !== req.user.id) {
        throw new ForbiddenException('You do not have permission to delete this task');
      }
      
      return this.tasksService.remove(+id);
    }
  }