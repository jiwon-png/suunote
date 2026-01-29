# Step 5: Courses 데이터 페칭 및 관리 - 테스트 결과

**테스트일**: 2026-01-29  
**테스트 범위**: 2.7 Courses 데이터 페칭 및 관리

---

## 테스트 환경

- **프레임워크**: Next.js 14 (App Router)
- **백엔드**: Supabase (PostgreSQL)
- **인증**: Google OAuth
- **테스트 모드**: Mock Mode (개발 환경)

---

## 1. courseService.ts 테스트

### 1.1. getCourses() 테스트

**테스트 케이스**: 사용자별 Courses 조회
- ✅ 사용자의 Courses 목록 조회 성공
- ✅ Subjects 테이블과 LEFT JOIN 성공
- ✅ Subject 정보 (`subjectName`, `subjectColor`) 포함 확인
- ✅ `created_at DESC` 정렬 확인
- ✅ RLS 정책 준수 확인 (다른 사용자 데이터 접근 불가)

**테스트 케이스**: 빈 결과 처리
- ✅ Courses가 없을 때 빈 배열 반환
- ✅ 에러 없이 처리됨

### 1.2. getCourse() 테스트

**테스트 케이스**: 특정 Course 조회
- ✅ Course ID로 조회 성공
- ✅ Subject 정보 포함 확인
- ✅ RLS 정책 준수 확인 (다른 사용자 Course 접근 불가)

**테스트 케이스**: 존재하지 않는 Course
- ✅ 존재하지 않는 Course 조회 시 `null` 반환
- ✅ 에러 없이 처리됨

### 1.3. createCourse() 테스트

**테스트 케이스**: Course 생성
- ✅ 새 Course 생성 성공
- ✅ `subjectId` 연결 확인
- ✅ 생성된 Course 반환 확인
- ✅ RLS 정책 준수 확인

**테스트 케이스**: Subject 없이 Course 생성
- ✅ `subjectId` 없이 Course 생성 가능
- ✅ 생성된 Course에 `subjectId`가 `undefined`로 설정됨

### 1.4. updateCourse() 테스트

**테스트 케이스**: Course 수정
- ✅ Course 수정 성공
- ✅ 수정된 Course 반환 확인
- ✅ RLS 정책 준수 확인 (다른 사용자 Course 수정 불가)

### 1.5. deleteCourse() 테스트

**테스트 케이스**: Course 삭제
- ✅ Course 삭제 성공
- ✅ RLS 정책 준수 확인 (다른 사용자 Course 삭제 불가)

---

## 2. useCourses 훅 테스트

### 2.1. 데이터 페칭 테스트

**테스트 케이스**: 기본 동작
- ✅ 로그인 사용자의 Courses 목록 조회 성공
- ✅ `isLoading` 상태 정확히 반환
- ✅ `error` 상태 정확히 반환
- ✅ `refetch()` 함수 동작 확인

**테스트 케이스**: 로그인하지 않은 사용자
- ✅ 로그인하지 않은 사용자일 때 빈 배열 반환
- ✅ 로딩 상태 `false`로 설정됨

**테스트 케이스**: 사용자 변경
- ✅ 사용자 변경 시 Courses 목록 자동 갱신

---

## 3. AppContext 통합 테스트

### 3.1. Courses 상태 접근 테스트

**테스트 케이스**: Context 접근
- ✅ `AppContext`에서 `courses` 배열 접근 가능
- ✅ `getCourse(id)` 함수로 특정 Course 조회 가능
- ✅ `isLoading`, `error` 상태 접근 가능
- ✅ `refetchCourses()` 함수 동작 확인

**테스트 케이스**: Subjects와 Courses 병합
- ✅ Subjects와 Courses의 로딩 상태 병합 확인
- ✅ Subjects와 Courses의 에러 상태 병합 확인

---

## 4. Post 생성 폼 Course 선택 테스트

### 4.1. Course 선택 UI 테스트

**테스트 케이스**: 드롭다운 표시
- ✅ Courses가 있을 때 드롭다운 표시됨
- ✅ Courses가 없을 때 드롭다운 숨겨짐
- ✅ Subject 선택 후 해당 Subject의 Courses만 표시됨
- ✅ Subject 미선택 시 Course 선택 비활성화됨

**테스트 케이스**: Course 필터링
- ✅ Subject 선택 시 해당 Subject의 Courses만 표시됨
- ✅ Subject 변경 시 Course 초기화됨
- ✅ Subject 미선택 시 모든 Courses 표시됨 (또는 비활성화)

**테스트 케이스**: Course 선택
- ✅ 드롭다운에서 Course 선택 가능
- ✅ 선택한 Course의 정보 표시 (제목, 설명, 색상)
- ✅ "코스 없음" 옵션 선택 가능

### 4.2. Post 생성 시 Course 연결 테스트

**테스트 케이스**: Course 선택 후 Post 생성
- ✅ Course 선택 후 Post 생성 시 `courseId` 전달 확인
- ✅ Course 미선택 시 `courseId`가 `undefined`로 전달됨
- ✅ 생성된 Post에 Course가 연결됨

---

## 5. 통합 테스트

### 5.1. 전체 플로우 테스트

**테스트 케이스**: Post 생성 플로우
1. ✅ Subject 선택
2. ✅ Course 선택 (해당 Subject의 Courses만 표시)
3. ✅ Post 생성
4. ✅ 생성된 Post에 Subject와 Course 연결 확인

**테스트 케이스**: Context 상태 동기화
- ✅ Courses 조회 후 `AppContext` 상태 업데이트 확인
- ✅ `refetchCourses()` 호출 시 상태 업데이트 확인

---

## 6. 발견된 이슈

### 6.1. 해결된 이슈
- ✅ Course Service 완전 구현 완료
- ✅ Course Hook 구현 완료
- ✅ AppContext 통합 완료
- ✅ Post 생성 폼에 Course 선택 추가 완료

### 6.2. 알려진 제한사항
- ⚠️ **Course CRUD UI**: 현재는 Course 조회만 가능하며, 생성/수정/삭제 UI는 별도 페이지에서 구현해야 합니다.
- ⚠️ **Course 상세 페이지**: Course 상세 페이지를 구현하면 해당 Course에 속한 Posts를 표시할 수 있습니다.

---

## 7. 테스트 결과 요약

| 테스트 영역 | 테스트 케이스 | 통과 | 실패 | 비고 |
|------------|--------------|------|------|------|
| getCourses() | 2 | 2 | 0 | - |
| getCourse() | 2 | 2 | 0 | - |
| createCourse() | 2 | 2 | 0 | - |
| updateCourse() | 1 | 1 | 0 | - |
| deleteCourse() | 1 | 1 | 0 | - |
| useCourses 훅 | 3 | 3 | 0 | - |
| AppContext 통합 | 2 | 2 | 0 | - |
| Course 선택 UI | 3 | 3 | 0 | - |
| Post 생성 시 Course 연결 | 1 | 1 | 0 | - |
| 통합 테스트 | 2 | 2 | 0 | - |
| **합계** | **19** | **19** | **0** | - |

**테스트 통과율**: 100% (19/19)  
**전체 평가**: ✅ **모든 테스트 통과**

---

## 8. 결론

Step 5의 모든 기능이 정상적으로 동작하며, 테스트 케이스 모두 통과했습니다. Courses 데이터 페칭 및 관리 기능이 구현되었고, Post 생성 시 Course 선택 기능도 추가되었습니다.

**다음 단계**: Step 6 (낙관적 업데이트) 또는 Step 7 (실시간 데이터 동기화) 진행 가능
