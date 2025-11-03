import React from 'react'; 
import { Input } from '@/components/react-ui/input';
import { Textarea } from '@/components/react-ui/textarea';
import { Label } from '@/components/react-ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/react-ui/select';
import { Checkbox } from '@/components/react-ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/react-ui/radio-group';

interface BaseFieldProps {
  label: string;
  name: string;
  value?: any;
  onChange: (name: string, value: any) => void;
  required?: boolean;
  description?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'tel' | 'url' | 'date';
  placeholder?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  rows?: number;
}

interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
}

interface RadioFieldProps extends BaseFieldProps {
  options: { value: string; label: string }[] | string[];
}

export function TextField({ label, name, value = '', onChange, required, description, type = 'text', placeholder }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-white"
      />
      {description && <p className="text-xs text-zinc-400">{description}</p>}
    </div>
  );
}

export function SelectField({ label, name, value = '', onChange, required, description, options, placeholder }: SelectFieldProps) {
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={(val) => onChange(name, val)}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {normalizedOptions.map(option => (
            <SelectItem key={option.value} value={option.value} className="bg-white hover:bg-gray-50">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <p className="text-xs text-zinc-400">{description}</p>}
    </div>
  );
}

export function TextareaField({ label, name, value = '', onChange, required, description, placeholder, rows = 3 }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="bg-white"
      />
      {description && <p className="text-xs text-zinc-400">{description}</p>}
    </div>
  );
}

export function CheckboxField({ label, name, checked = false, onChange, description }: CheckboxFieldProps) {
  return (
    <div className="flex items-start space-x-2">
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={(val) => onChange(name, val)}
      />
      <div className="space-y-1 leading-none">
        <Label htmlFor={name} className="text-xs font-medium cursor-pointer">
          {label}
        </Label>
        {description && <p className="text-xs text-zinc-400">{description}</p>}
      </div>
    </div>
  );
}

export function RadioField({ label, name, value = '', onChange, options, description }: RadioFieldProps) {
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <RadioGroup value={value} onValueChange={(val) => onChange(name, val)}>
        {normalizedOptions.map(option => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
            <Label htmlFor={`${name}-${option.value}`} className="text-xs cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {description && <p className="text-xs text-zinc-400">{description}</p>}
    </div>
  );
}