export const toHoursAndMinutes = (milliSeconds: number) => {
  const minutes = milliSeconds / 1000 / 60
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${Math.round(minutes % 60)}mins`
}
