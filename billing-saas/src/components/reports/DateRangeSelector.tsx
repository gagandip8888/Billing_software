"use client";

import React, { useState } from "react";
import { DateRangePreset, PRESET_LABELS } from "@/lib/date-range";
import { Calendar, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface DateRangeSelectorProps {
  currentPreset: DateRangePreset;
  fromDate?: string;
  toDate?: string;
  onRangeChange: (preset: DateRangePreset, from?: string, to?: string) => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  currentPreset,
  fromDate,
  toDate,
  onRangeChange,
  isLoading,
}: DateRangeSelectorProps) {
  const [isCustom, setIsCustom] = useState(currentPreset === "custom");
  const [customStart, setCustomStart] = useState(
    fromDate ? fromDate.split("T")[0] : ""
  );
  const [customEnd, setCustomEnd] = useState(
    toDate ? toDate.split("T")[0] : ""
  );

  const presets: DateRangePreset[] = [
    "today",
    "yesterday",
    "last7",
    "last30",
    "thisWeek",
    "thisMonth",
    "lastMonth",
    "thisYear",
    "custom",
  ];

  const handleSelectPreset = (p: DateRangePreset) => {
    if (p === "custom") {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    onRangeChange(p);
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    onRangeChange("custom", customStart, customEnd);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-9 gap-2 border-slate-200 bg-white font-semibold text-xs text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            <span>{PRESET_LABELS[currentPreset]}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 p-1">
          {presets.map((p) => {
            const isSelected = currentPreset === p;
            return (
              <DropdownMenuItem
                key={p}
                onClick={() => handleSelectPreset(p)}
                className={`flex items-center justify-between text-xs font-medium cursor-pointer ${
                  isSelected ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
                }`}
              >
                <span>{PRESET_LABELS[p]}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Pickers */}
      {(isCustom || currentPreset === "custom") && (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm animate-in fade-in">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-7 text-xs border-0 px-2 w-32 focus-visible:ring-0"
          />
          <span className="text-xs text-slate-400">to</span>
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-7 text-xs border-0 px-2 w-32 focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleApplyCustom}
            disabled={!customStart || !customEnd || isLoading}
            className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
