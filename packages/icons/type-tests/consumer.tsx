import { useRef } from 'react';
import {
  Archive,
  AlertTriangle,
  CalendarDays,
  Calendar,
  ChevronUp,
  Copy,
  EyeOff,
  File,
  FilePlus,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  MoreVertical,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Phone,
  Plus,
  Search,
  Share,
  SlidersHorizontal,
  Star,
  Users,
  UserPlus,
  User,
  type IconProps,
} from '@corefoundry-labs/forge-icons';

function IconConsumerExample() {
  const svgRef = useRef<SVGSVGElement>(null);
  const genericProps: IconProps = { size: '1.25rem', title: 'Add item', ref: svgRef };

  return (
    <>
      <Plus {...genericProps} />
      <Search aria-label="Search" size={20} />
      <AlertTriangle title="Review required" focusable="false" />
      <Calendar aria-label="Calendar" />
      <User aria-label="User profile" />
      <FileText title="Project document" />
      <MoreHorizontal aria-label="More actions" />
      <Home aria-label="Home" />
      <Users aria-label="Users" />
      <UserPlus aria-label="Invite user" />
      <Mail aria-label="Email" />
      <Phone aria-label="Phone" />
      <CalendarDays aria-label="Calendar days" />
      <File aria-label="File" />
      <FilePlus aria-label="New file" />
      <Copy aria-label="Copy" />
      <Share aria-label="Share" />
      <MoreVertical aria-label="More actions vertically" />
      <ChevronUp aria-label="Collapse" />
      <PanelLeft aria-label="Left panel" />
      <PanelRight aria-label="Right panel" />
      <SlidersHorizontal aria-label="Adjust filters" />
      <Archive aria-label="Archive" />
      <Star aria-label="Favorite" />
      <HelpCircle aria-label="Help" />
      <LogOut aria-label="Sign out" />
      <EyeOff aria-label="Hide details" />
    </>
  );
}

export const consumerExample = <IconConsumerExample />;

// The icon API always follows surrounding text color rather than a custom color prop.
// @ts-expect-error color is intentionally not part of IconProps.
export const invalidColor = <Plus color="red" />;
