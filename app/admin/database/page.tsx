'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Database, 
  TableProperties, 
  RefreshCw, 
  Play, 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle, 
  BarChart3,
  Users,
  Megaphone,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';

interface DbInfo {
  tables: { name: string }[];
  counts: {
    users: number;
    campaigns: number;
    donations: number;
  };
}

export default function DatabaseAdminPage() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Fetch database info on page load
  useEffect(() => {
    fetchDbInfo();
  }, []);

  // Function to fetch database info
  const fetchDbInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      if (data.success) {
        setDbInfo(data);
        setLastRefreshed(new Date().toLocaleTimeString());
      } else {
        toast.error('Failed to fetch database info');
        console.error(data.error);
      }
    } catch (error) {
      toast.error('Error connecting to the database');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Function to initialize the database
  const initializeDatabase = async () => {
    try {
      setInitializing(true);
      const response = await fetch('/api/init');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Database initialized successfully');
        // Refresh data after initialization
        fetchDbInfo();
      } else {
        toast.error('Failed to initialize database');
        console.error(data.error);
      }
    } catch (error) {
      toast.error('Error initializing database');
      console.error(error);
    } finally {
      setInitializing(false);
    }
  };
  
  // Function to run database migrations
  const runDatabaseMigrations = async () => {
    try {
      setMigrating(true);
      const response = await fetch('/api/migrate');
      const data = await response.json();
      
      if (data.success) {
        toast.success('Database migrations completed successfully');
        // Refresh data after migrations
        fetchDbInfo();
      } else {
        toast.error('Failed to run database migrations');
        console.error(data.error);
      }
    } catch (error) {
      toast.error('Error running database migrations');
      console.error(error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <section className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-5 mb-4">
              <div className="w-12 h-12 bg-[#b5f265] flex items-center justify-center shrink-0 rounded-full">
                <Database className="h-6 w-6 text-gray-800" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Database Administration</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your database configuration and data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDbInfo} 
              disabled={loading}
              className="flex items-center gap-1 rounded-md"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {lastRefreshed && (
              <span className="text-sm text-gray-500">
                Last updated: {lastRefreshed}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900 rounded-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900 rounded-md">
              Tables
            </TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-[#b5f265] data-[state=active]:text-gray-900 rounded-md">
              Operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Users</h3>
                    <p className="text-3xl font-bold">{loading ? '...' : dbInfo?.counts.users || 0}</p>
                  </div>
                </div>
                <div className="h-[2px] w-full bg-gray-100 dark:bg-gray-700 mb-4"></div>
                <p className="text-sm text-gray-500">
                  Total registered users in the system
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md">
                    <Megaphone className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Campaigns</h3>
                    <p className="text-3xl font-bold">{loading ? '...' : dbInfo?.counts.campaigns || 0}</p>
                  </div>
                </div>
                <div className="h-[2px] w-full bg-gray-100 dark:bg-gray-700 mb-4"></div>
                <p className="text-sm text-gray-500">
                  Total fundraising campaigns created
                </p>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-md">
                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 font-medium">Donations</h3>
                    <p className="text-3xl font-bold">{loading ? '...' : dbInfo?.counts.donations || 0}</p>
                  </div>
                </div>
                <div className="h-[2px] w-full bg-gray-100 dark:bg-gray-700 mb-4"></div>
                <p className="text-sm text-gray-500">
                  Total donations processed
                </p>
              </div>
            </div>

            <div className="mt-10 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                  <h2 className="text-xl font-bold">Database Status</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border-l-4 border-[#b5f265] rounded-r-md">
                  <span>Database connection</span>
                  <span className="flex items-center gap-1 font-medium text-green-600">
                    <CheckCircle className="h-4 w-4" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border-l-4 border-[#b5f265] rounded-r-md">
                  <span>Tables created</span>
                  <span className="font-medium">{loading ? '...' : dbInfo?.tables.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border-l-4 border-[#b5f265] rounded-r-md">
                  <span>Database type</span>
                  <span className="font-medium">Turso SQLite</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tables" className="mt-0">
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableProperties className="h-5 w-5 text-gray-500" />
                  <h2 className="text-xl font-bold">Database Tables</h2>
                </div>
                <span className="text-sm text-gray-500">
                  Total: {loading ? '...' : dbInfo?.tables.length || 0}
                </span>
              </div>
              
              {loading ? (
                <div className="p-6 py-12 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                  <span>Loading table information...</span>
                </div>
              ) : dbInfo?.tables && dbInfo.tables.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dbInfo.tables.map((table) => (
                    <div 
                      key={table.name} 
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <TableProperties className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{table.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="flex items-center gap-1 h-8 rounded-md">
                        <ArrowUpRight className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 py-12 text-center text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No tables found in the database.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="operations" className="mt-0">
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Play className="h-5 w-5 text-gray-500" />
                <h2 className="text-xl font-bold">Database Operations</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-5 border-l-4 border-blue-500 rounded-r-md">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                      <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">Initialize Database</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Create database tables and set up the initial schema structure. This is typically only needed when setting up the application for the first time.
                      </p>
                      <Button 
                        onClick={initializeDatabase} 
                        disabled={initializing}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        {initializing ? 'Initializing...' : 'Initialize Database'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 p-5 border-l-4 border-green-500 rounded-r-md">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                      <ArrowUpRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">Run Database Migrations</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Apply pending database schema changes and migrations. This updates your database structure to the latest version when the application is updated.
                      </p>
                      <Button 
                        onClick={runDatabaseMigrations} 
                        disabled={migrating}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-md"
                      >
                        {migrating ? 'Migrating...' : 'Run Migrations'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/30 p-5 border-l-4 border-amber-500 rounded-r-md">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-md">
                      <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-2">Important Note</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        These operations affect the production database directly. Make sure you understand the impact before running them. It&apos;s recommended to backup your data before making significant changes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 