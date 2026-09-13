import { Outlet } from 'react-router'
import Sidebar from '../../components/app/Sidebar'
import TaskModal from '../../components/app/TaskModal'

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0D1E]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
      <TaskModal />
    </div>
  )
}
