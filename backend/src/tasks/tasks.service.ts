import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

interface DateFilter {
    year?: number;
    month?: number;
    day?: number;
    mode: 'day' | 'month' | 'year';
  }

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

    async findAllByUser(userId: number, dateFilter?: DateFilter): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .orderBy('task.dueDate', 'ASC')
      .addOrderBy('task.createdAt', 'DESC');

    if (dateFilter) {
      const { year, month, day, mode } = dateFilter;
      
      if (mode === 'day' && year && month && day) {
        // Filter by specific day
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day + 1);
        query.andWhere('task.dueDate >= :startDate AND task.dueDate < :endDate', { 
          startDate, 
          endDate 
        });
      } else if (mode === 'month' && year && month) {
        // Filter by specific month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        query.andWhere('task.dueDate >= :startDate AND task.dueDate <= :endDate', { 
          startDate, 
          endDate 
        });
      } else if (mode === 'year' && year) {
        // Filter by specific year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        query.andWhere('task.dueDate >= :startDate AND task.dueDate <= :endDate', { 
          startDate, 
          endDate 
        });
      }
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Task | null> {
    return this.tasksRepository.findOne({
      where: { id },
    });
  }

  async create(createTaskDto: CreateTaskDto, userId: number): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
      status: 'PENDING',
    });
    
    return this.tasksRepository.save(task);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    await this.tasksRepository.update(id, updateTaskDto);
    const updatedTask = await this.tasksRepository.findOne({ where: { id } });
    
    if (!updatedTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    return updatedTask;
  }

  async remove(id: number): Promise<void> {
    await this.tasksRepository.delete(id);
  }
}