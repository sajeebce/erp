type TrainingWindow = {
  startDate: Date
  endDate: Date | null
}

export function getTrainingEnd(training: TrainingWindow): Date {
  if (training.endDate) return training.endDate

  const end = new Date(training.startDate)
  end.setHours(23, 59, 59, 999)
  return end
}

export function trainingWindowsOverlap(
  targetStart: Date,
  targetEnd: Date,
  otherStart: Date,
  otherEnd: Date
): boolean {
  return targetStart < otherEnd && otherStart < targetEnd
}

export function isInvalidDate(date: Date): boolean {
  return Number.isNaN(date.getTime())
}
