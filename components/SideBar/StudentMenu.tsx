export interface Student {
  email: string;
  displayName: string;
  groups: {
    name: string;
  };
}

export default function StudentMenu({ student }: { student: Student }) {
  return <></>;
}
