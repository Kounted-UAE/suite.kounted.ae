'use client'

import React, { useCallback, useRef } from "react"
import { Building, Plus, Users } from "lucide-react"
import { EmployerManagement } from "@/components/employers"
import { EmployeeManagement } from "@/components/employees"
import { Button } from "@/components/react-ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/react-ui/card"
import { PageHeader } from "@/components/react-layout/PageHeader"
import { TabbedSection, TabbedSectionContent } from "@/components/react-layout/TabbedSection"

export default function EntityManagementPage() {
  const employerActionsRef = useRef<{ openCreate: () => void } | null>(null)
  const employeeActionsRef = useRef<{ openCreate: () => void } | null>(null)

  const registerEmployerActions = useCallback((actions: { openCreate: () => void }) => {
    employerActionsRef.current = actions
  }, [])

  const registerEmployeeActions = useCallback((actions: { openCreate: () => void }) => {
    employeeActionsRef.current = actions
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Management"
        description="Manage employers and employees for payroll processing. Create and maintain core entity records that generate UUIDs for use in payroll transactions."
        breadcrumbs="Payroll Suite"
      />

      <TabbedSection
        tabs={[
          { value: "employers", label: "Employers", icon: Building },
          { value: "employees", label: "Employees", icon: Users },
        ]}
        defaultValue="employers"
        actions={(activeTab) =>
          activeTab === "employees" ? (
            <Button size="sm" onClick={() => employeeActionsRef.current?.openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          ) : (
            <Button size="sm" onClick={() => employerActionsRef.current?.openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employer
            </Button>
          )
        }
      >
        <TabbedSectionContent value="employers">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-base text-slate-600">
                <Building className="h-4 w-4" />
                Employer Records
              </CardTitle>
              <p className="text-sm text-slate-500">
                Manage company records. Each employer has a unique UUID that can be used in payroll
                imports to maintain data consistency.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <EmployerManagement registerActions={registerEmployerActions} />
            </CardContent>
          </Card>
        </TabbedSectionContent>

        <TabbedSectionContent value="employees">
          <Card>
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-base text-slate-600">
                <Users className="h-4 w-4" />
                Employee Records
              </CardTitle>
              <p className="text-sm text-slate-500">
                Manage employee records linked to employers. Each employee has a unique UUID that can
                be used in payroll imports to ensure proper identification.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <EmployeeManagement registerActions={registerEmployeeActions} />
            </CardContent>
          </Card>
        </TabbedSectionContent>
      </TabbedSection>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-800">
          <div>
            <h4 className="font-semibold">1. Create Employers First</h4>
            <p className="text-sm">
              Add company records with reviewer email addresses for payroll notifications.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">2. Add Employees</h4>
            <p className="text-sm">
              Create employee records and associate them with employers. Include banking details and
              MOL IDs as needed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">3. Use Generated UUIDs</h4>
            <p className="text-sm">
              Copy the generated UUIDs from these records to use in your payroll import files for
              consistent data linking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
