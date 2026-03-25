import { z } from 'zod'

export const employeeSchema = z.object({
  fullName: z.string().min(1),
  nameInBangla: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nidNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  departmentId: z.string().uuid(),
  designationId: z.string().uuid(),
  employmentType: z.enum(['FULL_TIME', 'CONTRACT', 'CONSULTANT', 'INTERN', 'VOLUNTEER']).optional(),
  joiningDate: z.string(),
  basicSalary: z.number().min(0).optional(),
  reportingToId: z.string().uuid().optional(),
})

export const leaveApplicationSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().int().positive(),
  reason: z.string().optional(),
})

export const attendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  otHours: z.number().min(0).optional(),
  notes: z.string().optional(),
})
