/**
 * 개념 노드 (Concept)
 * DB 테이블: public.concepts
 */
export interface Concept {
  id: string
  userId: string
  courseId?: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 개념 관계 (Concept Relationship)
 * 향후 확장용 (현재는 테이블 없음, 필요 시 추가)
 */
export interface ConceptRelationship {
  id: string
  fromConceptId: string
  toConceptId: string
  relationshipType?: 'prerequisite' | 'related' | 'example'
  createdAt: Date
}
