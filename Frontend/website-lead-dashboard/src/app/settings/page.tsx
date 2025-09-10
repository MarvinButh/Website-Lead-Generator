import SideBar from "@/components/SideBar";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-7xl">
        <SideBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Configure your preferences and application settings here.
          </p>
        </main>
      </div>
    </div>
  );
}
