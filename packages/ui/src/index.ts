import '@corefoundry-labs/forge-tokens/tokens.css';

// Platform appearance utility; preference and persistence remain consumer-owned.
export { useSystemTheme } from './hooks';
export type { SystemTheme } from './hooks';

// Actions
export { Button } from './components/actions/Button';
export type { ButtonProps, ButtonSize } from './components/actions/Button';
export { IconButton } from './components/actions/IconButton';
export type { IconButtonProps } from './components/actions/IconButton';

// Actions V2
export { ButtonV2 } from './componentsV2/actions/ButtonV2';
export type {
  ButtonV2Props,
  ButtonV2Size,
  ButtonV2Variant,
} from './componentsV2/actions/ButtonV2';

// Forms
export { TextInputV2 } from './componentsV2/forms/TextInputV2';
export type { TextInputV2Props, TextInputV2Size } from './componentsV2/forms/TextInputV2';
export { SelectV2 } from './componentsV2/forms/SelectV2';
export type { SelectV2Props, SelectV2Size } from './componentsV2/forms/SelectV2';
export { CheckboxV2 } from './componentsV2/forms/CheckboxV2';
export type { CheckboxV2Props } from './componentsV2/forms/CheckboxV2';
export { SwitchV2 } from './componentsV2/forms/SwitchV2';
export type { SwitchV2Props } from './componentsV2/forms/SwitchV2';
export { TextInput } from './components/forms/TextInput';
export type { TextInputProps } from './components/forms/TextInput';
// Compatibility aliases retained for existing application consumers.
export { TextInput as Input } from './components/forms/TextInput';
export type { TextInputProps as InputProps } from './components/forms/TextInput';
export { Checkbox } from './components/forms/Checkbox';
export type { CheckboxProps } from './components/forms/Checkbox';
export { Select } from './components/forms/Select';
export type { SelectProps } from './components/forms/Select';
export { Textarea } from './components/forms/Textarea';
export type { TextareaProps } from './components/forms/Textarea';
export { FormField } from './components/forms/FormField';
export type { FormFieldProps } from './components/forms/FormField';
export { SearchField } from './components/forms/SearchField';
export type { SearchFieldProps } from './components/forms/SearchField';
export { MultiSelect } from './components/forms/MultiSelect';
export type { MultiSelectOption, MultiSelectProps } from './components/forms/MultiSelect';
export { FilePicker } from './components/forms/FilePicker';
export type { FilePickerProps, FilePickerState } from './components/forms/FilePicker';
export { FormActions } from './components/forms/FormActions';
export type { FormActionsProps, FormActionsState } from './components/forms/FormActions';
export { Radio } from './components/forms/Radio';
export type { RadioProps } from './components/forms/Radio';
export { Switch } from './components/forms/Switch';
export type { SwitchProps } from './components/forms/Switch';

// Navigation
export { TabsV2 } from './componentsV2/navigation/TabsV2';
export type { TabsV2Activation, TabsV2Item, TabsV2Props, TabsV2Size, TabsV2Variant } from './componentsV2/navigation/TabsV2';
export { Tabs } from './components/navigation/Tabs';
export type { TabsProps, TabItem } from './components/navigation/Tabs';
export { Breadcrumbs } from './components/navigation/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/navigation/Breadcrumbs';
export { MenuItem } from './components/navigation/MenuItem';
export type { MenuItemProps } from './components/navigation/MenuItem';
export { StepperStep } from './components/navigation/StepperStep';
export type { StepperStepProps } from './components/navigation/StepperStep';

// Surfaces and status
export { CardV2 } from './componentsV2/surfaces/CardV2';
export type { CardV2Props, CardV2Variant } from './componentsV2/surfaces/CardV2';
export { Card } from './components/surfaces/Card';
export type { CardProps } from './components/surfaces/Card';
export { MetricCard } from './components/surfaces/MetricCard';
export type { MetricCardProps } from './components/surfaces/MetricCard';
export { StatusChip } from './components/status/StatusChip';
export type { StatusChipProps } from './components/status/StatusChip';
export { BadgeV2 } from './componentsV2/status/BadgeV2';
export type { BadgeV2Props, BadgeV2Size, BadgeV2Tone, BadgeV2Variant } from './componentsV2/status/BadgeV2';
export { Badge } from './components/status/Badge';
export type { BadgeProps } from './components/status/Badge';

// Feedback
export { AlertV2 } from './componentsV2/feedback/AlertV2';
export type { AlertV2Props, AlertV2Tone, AlertV2Variant } from './componentsV2/feedback/AlertV2';
export { Alert } from './components/feedback/Alert';
export type { AlertProps } from './components/feedback/Alert';
export { StatePanel } from './components/feedback/StatePanel';
export type { StatePanelProps } from './components/feedback/StatePanel';
export { Progress } from './components/feedback/Progress';
export type { ProgressProps } from './components/feedback/Progress';
export { Tooltip } from './components/feedback/Tooltip';
export type { TooltipProps } from './components/feedback/Tooltip';
export { Skeleton } from './components/feedback/Skeleton';
export type { SkeletonProps } from './components/feedback/Skeleton';
export { Toast } from './components/feedback/Toast';
export type { ToastProps } from './components/feedback/Toast';
export { EmptyState } from './components/feedback/EmptyState';
export type { EmptyStateProps } from './components/feedback/EmptyState';
export { LoadingState } from './components/feedback/LoadingState';
export type { LoadingStateProps } from './components/feedback/LoadingState';
export { ErrorState } from './components/feedback/ErrorState';
export type { ErrorStateProps } from './components/feedback/ErrorState';
export { FeedbackStateV2 } from './components/feedback/FeedbackStateV2';
export type {
  FeedbackStateV2Kind,
  FeedbackStateV2Props,
} from './components/feedback/FeedbackStateV2';

// Data display
export { RecordRow } from './components/data-display/RecordRow';
export type { RecordRowProps } from './components/data-display/RecordRow';
export { KeyValueRow } from './components/data-display/KeyValueRow';
export type { KeyValueRowProps } from './components/data-display/KeyValueRow';
export { TableRow } from './components/data-display/TableRow';
export type { TableRowProps } from './components/data-display/TableRow';
export { Table } from './components/data-display/Table';
export type { TableProps, TableColumn } from './components/data-display/Table';

// Overlays
export { DialogV2 } from './componentsV2/overlays/DialogV2';
export type { DialogV2Props, DialogV2Size } from './componentsV2/overlays/DialogV2';
export { TooltipV2 } from './componentsV2/overlays/TooltipV2';
export type { TooltipV2Placement, TooltipV2Props } from './componentsV2/overlays/TooltipV2';
export { PopoverV2 } from './componentsV2/overlays/PopoverV2';
export type { PopoverV2Align, PopoverV2Placement, PopoverV2Props, PopoverV2Width } from './componentsV2/overlays/PopoverV2';
export { DropdownMenuV2 } from './componentsV2/overlays/DropdownMenuV2';
export type {
  DropdownMenuV2Action,
  DropdownMenuV2Density,
  DropdownMenuV2Item,
  DropdownMenuV2Props,
  DropdownMenuV2Separator,
} from './componentsV2/overlays/DropdownMenuV2';
export { Dialog } from './components/overlays/Dialog';
export type { DialogProps } from './components/overlays/Dialog';
export { Popover } from './components/overlays/Popover';
export type { PopoverProps } from './components/overlays/Popover';

// Other shared compositions
export { ThemeScope } from './components/layout/ThemeScope';
export type { ThemeScopeProps, ThemeScopeTheme } from './components/layout/ThemeScope';
export { SectionHeader } from './components/layout/SectionHeader';
export type { SectionHeaderProps } from './components/layout/SectionHeader';
export { Divider } from './components/layout/Divider';
export type { DividerProps } from './components/layout/Divider';
export { CodeLabel } from './components/layout/CodeLabel';
export type { CodeLabelProps } from './components/layout/CodeLabel';
