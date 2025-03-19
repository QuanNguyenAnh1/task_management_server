import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/constants';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Định nghĩa interface Task trực tiếp trong file
interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];
type ViewMode = 'day' | 'month' | 'year';

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch tasks based on selected date and view mode
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        let url = `${API_URL}/tasks`;
        const params = new URLSearchParams();
        
        if (selectedDate instanceof Date) {
          const year = selectedDate.getFullYear();
          params.append('year', year.toString());
          params.append('mode', viewMode);
          
          if (viewMode === 'month' || viewMode === 'day') {
            const month = selectedDate.getMonth() + 1;
            params.append('month', month.toString());
          }
          
          if (viewMode === 'day') {
            const day = selectedDate.getDate();
            params.append('day', day.toString());
          }
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setTasks(response.data);
        setError('');
      } catch (error) {
        setError('Failed to fetch tasks');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token, selectedDate, viewMode]);

  // Add new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    const taskData = {
      title: newTask.title.trim(),
      description: newTask.description ? newTask.description.trim() : '',
      dueDate: newTask.dueDate || undefined
    };
    
    try {
      const response = await axios.post(
        `${API_URL}/tasks`,
        taskData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Chỉ thêm task vào danh sách hiện tại nếu nó phù hợp với filter hiện tại
      const newTaskDate = response.data.dueDate ? new Date(response.data.dueDate) : null;
      let shouldAddToCurrentList = false;
      
      if (newTaskDate && selectedDate instanceof Date) {
        const selectedYear = selectedDate.getFullYear();
        const selectedMonth = selectedDate.getMonth() + 1;
        const selectedDay = selectedDate.getDate();
        
        const taskYear = newTaskDate.getFullYear();
        const taskMonth = newTaskDate.getMonth() + 1;
        const taskDay = newTaskDate.getDate();
        
        if (viewMode === 'day') {
          shouldAddToCurrentList = 
            taskYear === selectedYear && 
            taskMonth === selectedMonth && 
            taskDay === selectedDay;
        } else if (viewMode === 'month') {
          shouldAddToCurrentList = 
            taskYear === selectedYear && 
            taskMonth === selectedMonth;
        } else if (viewMode === 'year') {
          shouldAddToCurrentList = taskYear === selectedYear;
        }
      }
      
      if (shouldAddToCurrentList) {
        setTasks([response.data, ...tasks]);
      }
      
      setNewTask({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Error adding task:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Response data:', axiosError.response.data);
        alert(`Failed to add task: ${JSON.stringify(axiosError.response.data)}`);
      } else {
        alert('Failed to add task');
      }
    }
  };

  // Toggle task status
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
      await axios.patch(
        `${API_URL}/tasks/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTasks(tasks.map(task => 
        task.id === id ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  // Delete task
  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  // Handle date change
  const handleDateChange = (value: Value) => {
    setSelectedDate(value);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get title based on selected date and view mode
  const getTitle = () => {
    if (!(selectedDate instanceof Date)) return 'Tasks';
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' };
    
    if (viewMode === 'month' || viewMode === 'day') {
      options.month = 'long';
    }
    
    if (viewMode === 'day') {
      options.day = 'numeric';
    }
    
    return `Tasks for ${selectedDate.toLocaleDateString('vi-VN', options)}`;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Thêm hàm xử lý khi thay đổi tháng/năm trên lịch
  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate && viewMode !== 'day') {
      setSelectedDate(activeStartDate);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Task Manager</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.username || 'User'}</span>
          <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.contentLayout}>
        <div style={styles.sidebarSection}>
          <div style={styles.calendarContainer}>
            <h3>Select Date</h3>
            <Calendar 
              onChange={handleDateChange} 
              value={selectedDate} 
              locale="vi-VN"
              onActiveStartDateChange={handleActiveStartDateChange}
            />
          </div>

          <div style={styles.viewModeContainer}>
            <h3>View Mode</h3>
            <div style={styles.viewModeButtons}>
              <button 
                style={{
                  ...styles.viewModeButton,
                  backgroundColor: viewMode === 'day' ? '#2196f3' : '#e0e0e0',
                  color: viewMode === 'day' ? 'white' : 'black',
                }}
                onClick={() => handleViewModeChange('day')}
              >
                Day
              </button>
              <button 
                style={{
                  ...styles.viewModeButton,
                  backgroundColor: viewMode === 'month' ? '#2196f3' : '#e0e0e0',
                  color: viewMode === 'month' ? 'white' : 'black',
                }}
                onClick={() => handleViewModeChange('month')}
              >
                Month
              </button>
              <button 
                style={{
                  ...styles.viewModeButton,
                  backgroundColor: viewMode === 'year' ? '#2196f3' : '#e0e0e0',
                  color: viewMode === 'year' ? 'white' : 'black',
                }}
                onClick={() => handleViewModeChange('year')}
              >
                Year
              </button>
            </div>
          </div>

          <div style={styles.addTaskSection}>
            <h3>Add New Task</h3>
            <form style={styles.addTaskForm} onSubmit={handleAddTask}>
              <input
                type="text"
                name="title"
                placeholder="Task title"
                style={styles.input}
                value={newTask.title}
                onChange={handleInputChange}
                required
              />
              <textarea
                name="description"
                placeholder="Task description (optional)"
                style={styles.textarea}
                value={newTask.description}
                onChange={handleInputChange}
              />
              <input
                type="date"
                name="dueDate"
                style={styles.input}
                value={newTask.dueDate}
                onChange={handleInputChange}
              />
              <button type="submit" style={styles.button}>Add Task</button>
            </form>
          </div>
        </div>

        <div style={styles.tasksSection}>
          <h2>{getTitle()}</h2>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.tasksList}>
            {tasks.length === 0 ? (
              <p>No tasks for this {viewMode}.</p>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  style={{
                    ...styles.taskItem,
                    backgroundColor: task.status === 'COMPLETED' ? '#e8f5e9' : 'white',
                    borderLeft: task.status === 'COMPLETED' ? '4px solid #4caf50' : '4px solid #2196f3'
                  }}
                >
                  <div style={styles.taskContent}>
                    <h3 style={{
                      ...styles.taskTitle,
                      textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p style={{
                        ...styles.taskDescription,
                        textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none'
                      }}>
                        {task.description}
                      </p>
                    )}
                    {task.dueDate && (
                      <p style={styles.taskDueDate}>
                        Due: {formatDate(task.dueDate)}
                      </p>
                    )}
                    <div style={styles.taskActions}>
                      <button
                        style={{
                          ...styles.statusButton,
                          backgroundColor: task.status === 'COMPLETED' ? '#ff9800' : '#4caf50'
                        }}
                        onClick={() => handleToggleStatus(task.id, task.status)}
                      >
                        {task.status === 'COMPLETED' ? 'Mark as Pending' : 'Mark as Completed'}
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
  },
  logoutButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  contentLayout: {
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap' as const,
    height: 'calc(100vh - 150px)', // Chiều cao cố định cho layout
  },
  sidebarSection: {
    flex: '0 0 300px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  calendarContainer: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  viewModeContainer: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  viewModeButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  viewModeButton: {
    flex: '1',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
  addTaskSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  tasksSection: {
    flex: '1',
    minWidth: '300px',
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: 'calc(100vh - 150px)',
    overflow: 'hidden',
  },
  tasksList: {
    overflowY: 'auto' as const,
    flex: '1',
    paddingRight: '10px',
  },
  addTaskForm: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    minHeight: '100px',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #eee',
    marginBottom: '1rem',
  },
  taskContent: {
    flex: '1',
  },
  taskTitle: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.2rem',
  },
  taskDescription: {
    margin: '0 0 0.5rem 0',
    color: '#666',
  },
  taskDueDate: {
    margin: '0 0 0.5rem 0',
    color: '#2196f3',
    fontWeight: 'bold' as const,
  },
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  statusButton: {
    padding: '0.5rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '0.5rem',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
  },
  error: {
    color: 'red',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
};

export default Tasks;