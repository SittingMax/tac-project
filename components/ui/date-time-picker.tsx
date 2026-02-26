'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
  use24Hour?: boolean;
}

// Generate hour options
const hours12 = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const hours24 = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  use24Hour = true,
}: TimePickerProps) {
  // Parse value into hours, minutes, period
  const parseTime = (timeStr: string | undefined) => {
    if (!timeStr) return { hours: '', minutes: '', period: 'AM' };
    const [h, m] = timeStr.split(':').map(Number);
    if (use24Hour) {
      return { hours: h.toString(), minutes: m.toString().padStart(2, '0'), period: 'AM' };
    }
    const period = h >= 12 ? 'PM' : 'AM';
    const hours12Val = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hours: hours12Val.toString(), minutes: m.toString().padStart(2, '0'), period };
  };

  const { hours: currentHours, minutes: currentMinutes, period: currentPeriod } = parseTime(value);

  const handleHourChange = (newHour: string) => {
    const h = parseInt(newHour, 10);
    const m = currentMinutes ? parseInt(currentMinutes, 10) : 0;
    let finalHour = h;
    if (!use24Hour) {
      if (currentPeriod === 'PM' && h !== 12) finalHour = h + 12;
      else if (currentPeriod === 'AM' && h === 12) finalHour = 0;
    }
    onChange?.(`${finalHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const h = currentHours ? parseInt(currentHours, 10) : 0;
    const m = parseInt(newMinute, 10);
    let finalHour = h;
    if (!use24Hour) {
      if (currentPeriod === 'PM' && h !== 12) finalHour = h + 12;
      else if (currentPeriod === 'AM' && h === 12) finalHour = 0;
    }
    onChange?.(`${finalHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const handlePeriodChange = (newPeriod: string) => {
    if (use24Hour) return;
    const h = currentHours ? parseInt(currentHours, 10) : 12;
    const m = currentMinutes ? parseInt(currentMinutes, 10) : 0;
    let finalHour = h;
    if (newPeriod === 'PM' && h !== 12) finalHour = h + 12;
    else if (newPeriod === 'AM' && h === 12) finalHour = 0;
    else if (newPeriod === 'AM' && h !== 12) finalHour = h;
    else if (newPeriod === 'PM' && h === 12) finalHour = 12;
    onChange?.(`${finalHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const hourOptions = use24Hour ? hours24 : hours12;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={currentHours} onValueChange={handleHourChange}>
        <SelectTrigger className="w-[70px] font-mono" disabled={disabled}>
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h.toString()} className="font-mono">
              {h.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-bold">:</span>
      <Select value={currentMinutes} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[70px] font-mono" disabled={disabled}>
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minutes.map((m) => (
            <SelectItem key={m} value={m.toString().padStart(2, '0')} className="font-mono">
              {m.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!use24Hour && (
        <Select value={currentPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[70px] font-mono" disabled={disabled}>
            <SelectValue placeholder="AM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM" className="font-mono">
              AM
            </SelectItem>
            <SelectItem value="PM" className="font-mono">
              PM
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick date and time',
  disabled = false,
  minDate,
  maxDate,
  showTime = true,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined);
      return;
    }
    // Preserve existing time if value exists
    if (value) {
      date.setHours(value.getHours(), value.getMinutes(), 0, 0);
    }
    onChange?.(date);
  };

  const handleTimeChange = (timeStr: string) => {
    if (!timeStr) return;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hours, minutes, 0, 0);
    onChange?.(newDate);
  };

  const timeValue = value
    ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
    : '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            showTime ? (
              format(value, "PPP 'at' p")
            ) : (
              format(value, 'PPP')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
        {showTime && (
          <div className="border-t p-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Time</Label>
            <TimePicker value={timeValue} onChange={handleTimeChange} use24Hour={true} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = 'Start date',
  endPlaceholder = 'End date',
  disabled = false,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        maxDate={endDate}
        className="flex-1"
      />
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        minDate={startDate}
        className="flex-1"
      />
    </div>
  );
}

export default DateTimePicker;
