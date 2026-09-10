import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { createTask, deleteTask, getTasks, updateTask, updateTaskStatus } from '../../api/taskApi'
import TaskCard from './TaskCard'
import SkeletonCard from '../SkeletonCard'
import TaskDetailsModal from './TaskDetailsModal'
import TaskFormModal from './TaskFormModal'
import PageTransition from '../PageTransition'
import { getProject } from '../../api/projectApi'

const columns = [
  { id: 'To-Do', title: 'To-Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Done', title: 'Done' },
]

const cardListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

function KanbanBoard() {
  const { id: projectId } = useParams()
  const [projectName, setProjectName] = useState('')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks(projectId)
      setTasks(data)
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    let isMounted = true

    const loadProject = async () => {
      try {
        const project = await getProject(projectId)
        if (isMounted) {
          setProjectName(project.name)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load the project.')
        }
      }
    }

    loadProject()
    return () => {
      isMounted = false
    }
  }, [projectId])

  const tasksByColumn = useMemo(() => {
    return columns.reduce((accumulator, column) => {
      accumulator[column.id] = tasks.filter((task) => task.status === column.id)
      return accumulator
    }, {})
  }, [tasks])

  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true)

    try {
      await createTask({ ...taskData, project: projectId })
      setIsModalOpen(false)
      toast.success('Task created successfully')
      await fetchTasks()
    } catch (err) {
      console.error('Create task error:', err?.response?.data ?? err)
      toast.error(err?.response?.data?.message || 'Could not create the task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openTaskEditor = (task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  const handleUpdateTask = async (taskData) => {
    if (!selectedTask?._id) return

    setIsSubmitting(true)

    try {
      await updateTask(selectedTask._id, taskData)
      setIsEditModalOpen(false)
      setSelectedTask(null)
      toast.success('Task updated successfully')
      await fetchTasks()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update the task.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask?._id) return

    const shouldDelete = window.confirm(`Delete "${selectedTask.title}"?`)
    if (!shouldDelete) return

    try {
      await deleteTask(selectedTask._id)
      setIsEditModalOpen(false)
      setSelectedTask(null)
      toast.success('Task deleted successfully')
      await fetchTasks()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the task.')
    }
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination) {
      return
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const taskToMove = tasks.find((task) => task._id === draggableId)
    if (!taskToMove) {
      return
    }

    const previousTasks = [...tasks]
    const nextStatus = destination.droppableId

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === draggableId ? { ...task, status: nextStatus } : task,
      ),
    )

    try {
      await updateTaskStatus(draggableId, nextStatus)
      toast.success('Task moved successfully')
    } catch (err) {
      setTasks(previousTasks)
      toast.error(err?.response?.data?.message || 'Could not move the task.')
    }
  }

  return (
    <PageTransition>
      <div className="kanban-page">
      <Toaster position="top-right" />

      <TaskFormModal
        isOpen={isModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isEditModalOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTask(null)
        }}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <div className="kanban-shell">
        <header className="kanban-header">
          <div className="kanban-header-title">
            <h1 className="kanban-title">Kanban Board</h1>
            {projectName && <span className="kanban-project-name">{projectName}</span>}
          </div>
          <motion.button
            type="button"
            className="kanban-button"
            onClick={() => setIsModalOpen(true)}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            + Add Task
          </motion.button>
        </header>

        {loading ? (
          <section className="kanban-columns" aria-label="Loading board">
            {columns.map((column) => (
              <div className="kanban-column" key={column.id}>
                <div className="kanban-column-header">
                  <h2 className="kanban-column-title">{column.title}</h2>
                  <span className="kanban-count">–</span>
                </div>
                <div className="kanban-card-list">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SkeletonCard key={index} variant="task" />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : error ? (
          <p className="kanban-state kanban-state-error">{error}</p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <section className="kanban-columns" aria-label="Kanban board columns">
              {columns.map((column) => {
                const columnTasks = tasksByColumn[column.id] || []

                return (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`kanban-column ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <div className="kanban-column-header">
                          <h2 className="kanban-column-title">{column.title}</h2>
                          <span className="kanban-count">{columnTasks.length}</span>
                        </div>

                        <motion.div
                          className="kanban-card-list"
                          variants={cardListVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {columnTasks.length > 0 ? (
                            columnTasks.map((task, index) => (
                              <Draggable key={task._id} draggableId={String(task._id)} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <TaskCard
                                    task={task}
                                    onClick={() => openTaskEditor(task)}
                                    provided={dragProvided}
                                    snapshot={dragSnapshot}
                                  />
                                )}
                              </Draggable>
                            ))
                          ) : (
                            <p className="kanban-empty-state">No tasks in this column.</p>
                          )}
                          {provided.placeholder}
                        </motion.div>
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </section>
          </DragDropContext>
        )}
      </div>
      </div>
    </PageTransition>
  )
}

export default KanbanBoard
