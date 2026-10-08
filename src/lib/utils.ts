import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Display label for a role value stored as "teacher", "ta" or "both". */
export function roleLabel(role: string): string {
  if (role === "ta") return "TA"
  if (role === "both") return "Teacher or TA"
  if (role === "teacher") return "Teacher"
  return role
}
