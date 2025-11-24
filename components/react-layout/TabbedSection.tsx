'use client'

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/react-ui/tabs"
import { cn } from "@/lib/utils"

export interface TabDefinition {
  value: string
  label: React.ReactNode
  icon?: React.ElementType
  badge?: React.ReactNode
  disabled?: boolean
}

export interface TabbedSectionProps {
  tabs: TabDefinition[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  actions?: React.ReactNode | ((activeTab: string) => React.ReactNode)
  children: React.ReactNode
  className?: string
  listClassName?: string
}

export function TabbedSection({
  tabs,
  defaultValue,
  value,
  onValueChange,
  actions,
  children,
  className,
  listClassName,
}: TabbedSectionProps) {
  const derivedDefault = defaultValue ?? tabs[0]?.value
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string>(derivedDefault || "")
  const currentValue = (isControlled ? value : internalValue) ?? ""

  React.useEffect(() => {
    if (!isControlled && derivedDefault) {
      setInternalValue(derivedDefault)
    }
  }, [derivedDefault, isControlled])

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next)
      }
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const resolvedActions =
    typeof actions === "function" ? actions(currentValue) : actions

  return (
    <Tabs
      defaultValue={derivedDefault}
      value={currentValue}
      onValueChange={handleValueChange}
      className={cn("suite-tabbed-section w-full", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:hidden">
          <label htmlFor="tabbed-section-select" className="sr-only">
            Select a tab
          </label>
          <div className="relative">
            <select
              id="tabbed-section-select"
              value={currentValue}
              onChange={(event) => handleValueChange(event.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {tabs.map((tab) => (
                <option key={tab.value} value={tab.value}>
                  {tab.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              ▾
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList
            className={cn(
              "hidden gap-2 bg-transparent p-0 sm:flex",
              listClassName
            )}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors",
                    "text-zinc-700 hover:text-zinc-700/80",
                    "data-[state=active]:bg-gradient-to-br data-[state=active]:from-zinc-600 data-[state=active]:to-zinc-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=active]:hover:from-zinc-500 data-[state=active]:hover:to-zinc-600",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-300"
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span>{tab.label}</span>
                  {tab.badge ? <span>{tab.badge}</span> : null}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {resolvedActions ? (
            <div className="flex items-center gap-2">{resolvedActions}</div>
          ) : null}
        </div>
      </div>
      {children}
    </Tabs>
  )
}

export { TabsContent as TabbedSectionContent }

