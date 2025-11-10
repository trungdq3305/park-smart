export function formatDateToLocalYYYYMMDD(date: Date): string {
  // Lấy các thành phần theo giờ local
  const year = date.getFullYear()

  // getMonth() trả về 0-11, nên phải +1
  const month = (date.getMonth() + 1).toString().padStart(2, '0')

  const day = date.getDate().toString().padStart(2, '0')

  return `${String(year)}-${month}-${day}`
}
