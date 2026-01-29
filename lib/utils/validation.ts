export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max
}

/**
 * Post 제목 검증
 */
export function validatePostTitle(title: string): { valid: boolean; error?: string } {
  if (!validateRequired(title)) {
    return { valid: false, error: '제목을 입력해주세요.' }
  }
  if (!validateMinLength(title, 1)) {
    return { valid: false, error: '제목은 최소 1자 이상이어야 합니다.' }
  }
  if (!validateMaxLength(title, 200)) {
    return { valid: false, error: '제목은 200자 이하여야 합니다.' }
  }
  return { valid: true }
}

/**
 * Post 내용 검증
 */
export function validatePostContent(content: string): { valid: boolean; error?: string } {
  if (!validateRequired(content)) {
    return { valid: false, error: '학습 내용을 입력해주세요.' }
  }
  if (!validateMinLength(content, 10)) {
    return { valid: false, error: '학습 내용은 최소 10자 이상이어야 합니다.' }
  }
  if (!validateMaxLength(content, 10000)) {
    return { valid: false, error: '학습 내용은 10,000자 이하여야 합니다.' }
  }
  return { valid: true }
}

/**
 * Subject 이름 검증
 */
export function validateSubjectName(name: string): { valid: boolean; error?: string } {
  if (!validateRequired(name)) {
    return { valid: false, error: '과목 이름을 입력해주세요.' }
  }
  if (!validateMinLength(name, 1)) {
    return { valid: false, error: '과목 이름은 최소 1자 이상이어야 합니다.' }
  }
  if (!validateMaxLength(name, 50)) {
    return { valid: false, error: '과목 이름은 50자 이하여야 합니다.' }
  }
  return { valid: true }
}

/**
 * 색상 코드 검증 (hex color)
 */
export function validateColor(color: string): { valid: boolean; error?: string } {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!hexColorRegex.test(color)) {
    return { valid: false, error: '올바른 색상 코드를 입력해주세요. (예: #FF0000)' }
  }
  return { valid: true }
}
