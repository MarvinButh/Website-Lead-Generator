import SideBar from "@/components/SideBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <SideBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold">Website Lead Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Welcome to the Website Lead Dashboard. Here you can find all the information about your leads.
          </p>

          <footer className="mt-10 border-t border-gray-200 p-4 text-center dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Website Lead Dashboard. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
