'use client'

import React, { useState } from 'react'
import { EmployerManagement } from '@/components/employers'
import { EmployeeManagement } from '@/components/employees'
import { Button } from '@/components/react-ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/react-ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/react-ui/tabs'
import { Building, Users } from 'lucide-react'

export default function EntityManagementPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Entity Management</CardTitle>
            <CardDescription>
              Manage employers and employees for payroll processing. Create and maintain 
              core entity records that generate UUIDs for use in payroll transactions.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="employers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employers" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Employers
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employers">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Employer Management
                </CardTitle>
                <CardDescription>
                  Manage company records. Each employer has a unique UUID that can be used 
                  in payroll imports to maintain data consistency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployerManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Management
                </CardTitle>
                <CardDescription>
                  Manage employee records linked to employers. Each employee has a unique UUID 
                  that can be used in payroll imports to ensure proper employee identification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">1. Create Employers First</h4>
                <p className="text-sm">Add company records with reviewer email addresses for payroll notifications.</p>
              </div>
              <div>
                <h4 className="font-semibold">2. Add Employees</h4>
                <p className="text-sm">Create employee records and associate them with employers. Include banking details and MOL IDs as needed.</p>
              </div>
              <div>
                <h4 className="font-semibold">3. Use Generated UUIDs</h4>
                <p className="text-sm">Copy the generated UUIDs from these records to use in your payroll import files for consistent data linking.</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
