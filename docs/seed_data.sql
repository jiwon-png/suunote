-- ============================================
-- SSU-Note 시드 데이터 (Seed Data)
-- Supabase SQL Editor에서 실행 가능
-- ============================================
-- 
-- 주의사항:
-- 1. 이 스크립트는 RLS 정책을 우회하기 위해 SECURITY DEFINER 함수를 사용합니다.
-- 2. 실제 사용하려면 auth.users 테이블에 해당 UUID의 사용자가 존재해야 합니다.
-- 3. 테스트 환경에서는 Supabase Dashboard에서 직접 실행하거나,
--    SECURITY DEFINER 권한이 있는 함수를 통해 실행하세요.
-- ============================================

-- ============================================
-- 테스트용 사용자 UUID (실제 auth.users에 존재해야 함)
-- ============================================
-- 사용자 1: 컴퓨터공학과 재학생
-- 사용자 2: 소프트웨어 전공 대학생
-- 사용자 3: 정보통신공학과 재학생

-- ============================================
-- SECURITY DEFINER 함수: 시드 데이터 삽입
-- ============================================
CREATE OR REPLACE FUNCTION insert_seed_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- 사용자 UUID (실제 auth.users에 존재해야 함)
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  user3_id UUID := '33333333-3333-3333-3333-333333333333';
  
  -- 과목 UUID
  sub1_db_id UUID;
  sub1_os_id UUID;
  sub1_algo_id UUID;
  sub2_web_id UUID;
  sub2_db_id UUID;
  sub2_network_id UUID;
  sub3_ml_id UUID;
  sub3_os_id UUID;
  
  -- 코스 UUID
  course1_id UUID;
  course2_id UUID;
  course3_id UUID;
  course4_id UUID;
  course5_id UUID;
  course6_id UUID;
  course7_id UUID;
  course8_id UUID;
  
  -- 포스트 UUID
  post1_id UUID;
  post2_id UUID;
  post3_id UUID;
  post4_id UUID;
  post5_id UUID;
  post6_id UUID;
  post7_id UUID;
  post8_id UUID;
BEGIN
  -- ============================================
  -- 1. Profiles (사용자 프로필)
  -- ============================================
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES
    (user1_id, 'student1@ssu.ac.kr', '김학생', NULL, 'user'),
    (user2_id, 'student2@ssu.ac.kr', '이학생', NULL, 'user'),
    (user3_id, 'student3@ssu.ac.kr', '박학생', NULL, 'user')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- 2. Subjects (과목)
  -- ============================================
  -- 사용자 1의 과목
  INSERT INTO public.subjects (id, user_id, name, slug, color, sort_order)
  VALUES
    (gen_random_uuid(), user1_id, '데이터베이스', 'database', '#3B82F6', 1),
    (gen_random_uuid(), user1_id, '운영체제', 'operating-system', '#10B981', 2),
    (gen_random_uuid(), user1_id, '알고리즘', 'algorithm', '#F59E0B', 3)
  ON CONFLICT (user_id, slug) DO NOTHING;

  -- 사용자 1의 과목 ID 조회
  SELECT id INTO sub1_db_id FROM public.subjects WHERE user_id = user1_id AND slug = 'database';
  SELECT id INTO sub1_os_id FROM public.subjects WHERE user_id = user1_id AND slug = 'operating-system';
  SELECT id INTO sub1_algo_id FROM public.subjects WHERE user_id = user1_id AND slug = 'algorithm';

  -- 사용자 2의 과목
  INSERT INTO public.subjects (id, user_id, name, slug, color, sort_order)
  VALUES
    (gen_random_uuid(), user2_id, '웹 프로그래밍', 'web-programming', '#8B5CF6', 1),
    (gen_random_uuid(), user2_id, '데이터베이스 설계', 'database-design', '#EC4899', 2),
    (gen_random_uuid(), user2_id, '네트워크 프로그래밍', 'network-programming', '#06B6D4', 3)
  ON CONFLICT (user_id, slug) DO NOTHING;

  SELECT id INTO sub2_web_id FROM public.subjects WHERE user_id = user2_id AND slug = 'web-programming';
  SELECT id INTO sub2_db_id FROM public.subjects WHERE user_id = user2_id AND slug = 'database-design';
  SELECT id INTO sub2_network_id FROM public.subjects WHERE user_id = user2_id AND slug = 'network-programming';

  -- 사용자 3의 과목
  INSERT INTO public.subjects (id, user_id, name, slug, color, sort_order)
  VALUES
    (gen_random_uuid(), user3_id, '머신러닝', 'machine-learning', '#EF4444', 1),
    (gen_random_uuid(), user3_id, '운영체제', 'operating-system', '#14B8A6', 2)
  ON CONFLICT (user_id, slug) DO NOTHING;

  SELECT id INTO sub3_ml_id FROM public.subjects WHERE user_id = user3_id AND slug = 'machine-learning';
  SELECT id INTO sub3_os_id FROM public.subjects WHERE user_id = user3_id AND slug = 'operating-system';

  -- 과목 ID NULL 체크
  IF sub1_db_id IS NULL OR sub1_os_id IS NULL OR sub1_algo_id IS NULL THEN
    RAISE EXCEPTION '사용자 1의 과목 ID를 가져오지 못했습니다.';
  END IF;
  
  IF sub2_web_id IS NULL OR sub2_db_id IS NULL OR sub2_network_id IS NULL THEN
    RAISE EXCEPTION '사용자 2의 과목 ID를 가져오지 못했습니다.';
  END IF;
  
  IF sub3_ml_id IS NULL OR sub3_os_id IS NULL THEN
    RAISE EXCEPTION '사용자 3의 과목 ID를 가져오지 못했습니다.';
  END IF;

  -- ============================================
  -- 3. Courses (코스)
  -- ============================================
  -- 사용자 1의 코스
  INSERT INTO public.courses (id, user_id, subject_id, title, description, course_date)
  VALUES
    (gen_random_uuid(), user1_id, sub1_db_id, '데이터베이스 1주차 - 정규화', '관계형 데이터베이스의 정규화 이론과 실습', '2025-01-15'),
    (gen_random_uuid(), user1_id, sub1_db_id, '데이터베이스 2주차 - 인덱싱과 쿼리 최적화', '인덱스의 개념과 쿼리 성능 최적화 방법', '2025-01-22'),
    (gen_random_uuid(), user1_id, sub1_os_id, '운영체제 - 프로세스 스케줄링', 'CPU 스케줄링 알고리즘과 프로세스 관리', '2025-01-20'),
    (gen_random_uuid(), user1_id, sub1_algo_id, '알고리즘 - 그래프 탐색', 'DFS, BFS 알고리즘과 최단 경로 문제', '2025-01-18')
  ON CONFLICT DO NOTHING;

  SELECT id INTO course1_id FROM public.courses WHERE user_id = user1_id AND title = '데이터베이스 1주차 - 정규화';
  SELECT id INTO course2_id FROM public.courses WHERE user_id = user1_id AND title = '데이터베이스 2주차 - 인덱싱과 쿼리 최적화';
  SELECT id INTO course3_id FROM public.courses WHERE user_id = user1_id AND title = '운영체제 - 프로세스 스케줄링';
  SELECT id INTO course4_id FROM public.courses WHERE user_id = user1_id AND title = '알고리즘 - 그래프 탐색';

  -- 사용자 2의 코스
  INSERT INTO public.courses (id, user_id, subject_id, title, description, course_date)
  VALUES
    (gen_random_uuid(), user2_id, sub2_web_id, '웹 프로그래밍 - React 기초', 'React 컴포넌트와 상태 관리 기초', '2025-01-16'),
    (gen_random_uuid(), user2_id, sub2_db_id, '데이터베이스 설계 - ER 모델링', '엔티티 관계 다이어그램 작성과 정규화', '2025-01-19'),
    (gen_random_uuid(), user2_id, sub2_network_id, '네트워크 프로그래밍 - 소켓 통신', 'TCP/UDP 소켓 프로그래밍 실습', '2025-01-21')
  ON CONFLICT DO NOTHING;

  SELECT id INTO course5_id FROM public.courses WHERE user_id = user2_id AND title = '웹 프로그래밍 - React 기초';
  SELECT id INTO course6_id FROM public.courses WHERE user_id = user2_id AND title = '데이터베이스 설계 - ER 모델링';
  SELECT id INTO course7_id FROM public.courses WHERE user_id = user2_id AND title = '네트워크 프로그래밍 - 소켓 통신';

  -- 사용자 3의 코스
  INSERT INTO public.courses (id, user_id, subject_id, title, description, course_date)
  VALUES
    (gen_random_uuid(), user3_id, sub3_ml_id, '머신러닝 - 선형 회귀', '선형 회귀 모델의 이론과 구현', '2025-01-17'),
    (gen_random_uuid(), user3_id, sub3_os_id, '운영체제 - 메모리 관리', '가상 메모리와 페이지 교체 알고리즘', '2025-01-23')
  ON CONFLICT DO NOTHING;

  SELECT id INTO course8_id FROM public.courses WHERE user_id = user3_id AND title = '머신러닝 - 선형 회귀';
  
  -- 코스 ID NULL 체크
  IF course1_id IS NULL OR course2_id IS NULL OR course3_id IS NULL OR course4_id IS NULL THEN
    RAISE EXCEPTION '사용자 1의 코스 ID를 가져오지 못했습니다.';
  END IF;
  
  IF course5_id IS NULL OR course6_id IS NULL OR course7_id IS NULL THEN
    RAISE EXCEPTION '사용자 2의 코스 ID를 가져오지 못했습니다.';
  END IF;
  
  IF course8_id IS NULL THEN
    RAISE EXCEPTION '사용자 3의 코스 ID를 가져오지 못했습니다.';
  END IF;

  -- ============================================
  -- 4. Posts (학습 노트)
  -- ============================================
  -- 사용자 1의 포스트
  INSERT INTO public.posts (id, user_id, course_id, subject_id, title, content, combined_content, ai_processed)
  VALUES
    (
      gen_random_uuid(),
      user1_id,
      course1_id,
      sub1_db_id,
      '정규화 이론 정리',
      E'# 정규화 (Normalization)\n\n## 1NF (제1정규형)\n- 모든 속성은 원자값(atomic value)을 가져야 함\n- 중복된 그룹이 없어야 함\n\n## 2NF (제2정규형)\n- 1NF를 만족\n- 부분 함수 종속 제거\n- 모든 비주요 속성이 주요 속성에 완전 함수 종속\n\n## 3NF (제3정규형)\n- 2NF를 만족\n- 이행 함수 종속 제거\n- 비주요 속성이 다른 비주요 속성에 종속되지 않음\n\n## BCNF (Boyce-Codd 정규형)\n- 3NF를 만족\n- 모든 결정자가 후보키여야 함\n\n## 예시\n학생 테이블에서 학번이 기본키이고, 학과코드가 학과명을 결정한다면\n학과명은 학과코드에 종속되므로 3NF를 위반합니다.',
      E'정규화는 데이터베이스 설계에서 중복을 제거하고 데이터 무결성을 보장하는 중요한 과정입니다. 1NF부터 BCNF까지 단계적으로 정규화를 수행하여 이상 현상을 방지할 수 있습니다.',
      true
    ),
    (
      gen_random_uuid(),
      user1_id,
      course2_id,
      sub1_db_id,
      '인덱스와 쿼리 최적화',
      E'# 인덱스 (Index)\n\n## 인덱스의 개념\n- 데이터베이스에서 검색 속도를 향상시키기 위한 자료구조\n- 책의 색인과 유사한 개념\n\n## 인덱스의 종류\n1. B-Tree 인덱스: 범위 검색에 유리\n2. Hash 인덱스: 동등 검색에 유리\n3. Bitmap 인덱스: 카디널리티가 낮은 컬럼에 적합\n\n## 인덱스 사용 시 주의사항\n- 인덱스는 저장 공간을 차지함\n- INSERT, UPDATE, DELETE 성능이 저하될 수 있음\n- 너무 많은 인덱스는 오히려 성능을 저하시킬 수 있음\n\n## 쿼리 최적화 팁\n1. WHERE 절에 자주 사용되는 컬럼에 인덱스 생성\n2. JOIN 조건에 사용되는 컬럼에 인덱스 생성\n3. EXPLAIN PLAN을 사용하여 실행 계획 확인',
      E'인덱스는 데이터베이스 성능 향상을 위한 핵심 요소입니다. 적절한 인덱스 설계와 쿼리 최적화를 통해 빠른 검색 속도를 달성할 수 있습니다.',
      true
    ),
    (
      gen_random_uuid(),
      user1_id,
      course3_id,
      sub1_os_id,
      '프로세스 스케줄링 알고리즘',
      E'# 프로세스 스케줄링\n\n## 스케줄링의 목적\n- CPU 이용률 최대화\n- 처리량 최대화\n- 응답 시간 최소화\n- 대기 시간 최소화\n\n## 선입선출 (FCFS - First Come First Served)\n- 가장 간단한 스케줄링 알고리즘\n- 비선점형\n- 호위 효과(convoy effect) 발생 가능\n\n## 최단 작업 우선 (SJF - Shortest Job First)\n- 실행 시간이 가장 짧은 프로세스부터 처리\n- 평균 대기 시간 최소화\n- 기아 현상 발생 가능\n\n## 라운드 로빈 (Round Robin)\n- 시간 할당량(time quantum)을 할당\n- 선점형 스케줄링\n- 응답 시간이 빠름\n\n## 우선순위 스케줄링\n- 각 프로세스에 우선순위 부여\n- 기아 현상 방지를 위한 에이징(aging) 필요',
      E'프로세스 스케줄링은 운영체제의 핵심 기능으로, 다양한 알고리즘을 통해 CPU 자원을 효율적으로 관리합니다.',
      false
    ),
    (
      gen_random_uuid(),
      user1_id,
      course4_id,
      sub1_algo_id,
      '그래프 탐색 알고리즘',
      E'# 그래프 탐색\n\n## 깊이 우선 탐색 (DFS - Depth First Search)\n- 스택 또는 재귀를 사용\n- 한 경로를 끝까지 탐색한 후 백트래킹\n- 시간 복잡도: O(V + E)\n\n## 너비 우선 탐색 (BFS - Breadth First Search)\n- 큐를 사용\n- 시작점에서 가까운 노드부터 탐색\n- 최단 경로 문제에 유용\n- 시간 복잡도: O(V + E)\n\n## 최단 경로 알고리즘\n1. 다익스트라 알고리즘: 단일 출발점 최단 경로\n2. 벨만-포드 알고리즘: 음수 가중치 허용\n3. 플로이드-워셜 알고리즘: 모든 쌍 최단 경로',
      E'그래프 탐색 알고리즘은 네트워크 분석, 경로 찾기 등 다양한 문제 해결에 활용됩니다.',
      false
    )
  ON CONFLICT DO NOTHING;

  SELECT id INTO post1_id FROM public.posts WHERE user_id = user1_id AND title = '정규화 이론 정리';
  SELECT id INTO post2_id FROM public.posts WHERE user_id = user1_id AND title = '인덱스와 쿼리 최적화';
  SELECT id INTO post3_id FROM public.posts WHERE user_id = user1_id AND title = '프로세스 스케줄링 알고리즘';
  SELECT id INTO post4_id FROM public.posts WHERE user_id = user1_id AND title = '그래프 탐색 알고리즘';

  -- 사용자 2의 포스트
  INSERT INTO public.posts (id, user_id, course_id, subject_id, title, content, combined_content, ai_processed)
  VALUES
    (
      gen_random_uuid(),
      user2_id,
      course5_id,
      sub2_web_id,
      'React 컴포넌트와 상태 관리',
      E'# React 기초\n\n## 컴포넌트\n- 재사용 가능한 UI 블록\n- 함수형 컴포넌트와 클래스 컴포넌트\n- JSX 문법 사용\n\n## 상태 관리\n- useState Hook: 함수형 컴포넌트에서 상태 관리\n- useEffect Hook: 사이드 이펙트 처리\n- Context API: 전역 상태 관리\n\n## Props\n- 부모 컴포넌트에서 자식 컴포넌트로 데이터 전달\n- 단방향 데이터 흐름\n- 불변성 유지 중요',
      E'React는 선언적 UI 라이브러리로, 컴포넌트 기반 개발을 통해 재사용 가능한 코드를 작성할 수 있습니다.',
      true
    ),
    (
      gen_random_uuid(),
      user2_id,
      course6_id,
      sub2_db_id,
      'ER 모델링 기초',
      E'# ER 모델 (Entity-Relationship Model)\n\n## 엔티티 (Entity)\n- 데이터베이스에 저장할 대상\n- 강한 엔티티와 약한 엔티티\n\n## 속성 (Attribute)\n- 엔티티의 특성\n- 단순 속성, 복합 속성, 다중값 속성\n\n## 관계 (Relationship)\n- 엔티티 간의 연관\n- 1:1, 1:N, N:M 관계\n\n## ER 다이어그램 작성\n- 사각형: 엔티티\n- 마름모: 관계\n- 타원: 속성\n- 밑줄: 기본키',
      E'ER 모델링은 데이터베이스 설계의 첫 단계로, 현실 세계를 개념적으로 모델링합니다.',
      false
    ),
    (
      gen_random_uuid(),
      user2_id,
      course7_id,
      sub2_network_id,
      '소켓 프로그래밍 실습',
      E'# 소켓 프로그래밍\n\n## 소켓의 개념\n- 네트워크 통신의 엔드포인트\n- IP 주소와 포트 번호로 식별\n\n## TCP 소켓\n- 연결 지향형\n- 신뢰성 있는 데이터 전송\n- 3-way handshake\n\n## UDP 소켓\n- 비연결형\n- 빠른 전송 속도\n- 신뢰성 보장 안 됨\n\n## 소켓 프로그래밍 절차\n1. 소켓 생성\n2. 주소 바인딩\n3. 연결 수신/요청\n4. 데이터 송수신\n5. 소켓 닫기',
      E'소켓 프로그래밍은 네트워크 애플리케이션 개발의 기초입니다.',
      false
    )
  ON CONFLICT DO NOTHING;

  SELECT id INTO post5_id FROM public.posts WHERE user_id = user2_id AND title = 'React 컴포넌트와 상태 관리';
  SELECT id INTO post6_id FROM public.posts WHERE user_id = user2_id AND title = 'ER 모델링 기초';
  SELECT id INTO post7_id FROM public.posts WHERE user_id = user2_id AND title = '소켓 프로그래밍 실습';

  -- 사용자 3의 포스트
  INSERT INTO public.posts (id, user_id, course_id, subject_id, title, content, combined_content, ai_processed)
  VALUES
    (
      gen_random_uuid(),
      user3_id,
      course8_id,
      sub3_ml_id,
      '선형 회귀 모델',
      E'# 선형 회귀 (Linear Regression)\n\n## 개념\n- 독립 변수와 종속 변수 간의 선형 관계 모델링\n- y = ax + b 형태\n\n## 최소 제곱법 (Least Squares)\n- 오차의 제곱 합을 최소화하는 계수 찾기\n- 정규 방정식 사용\n\n## 평가 지표\n- MSE (Mean Squared Error)\n- RMSE (Root Mean Squared Error)\n- R² (결정 계수)\n\n## 다중 선형 회귀\n- 여러 독립 변수 사용\n- y = a₁x₁ + a₂x₂ + ... + b',
      E'선형 회귀는 머신러닝의 가장 기본적인 알고리즘으로, 예측 모델링에 널리 사용됩니다.',
      true
    )
  ON CONFLICT DO NOTHING;

  SELECT id INTO post8_id FROM public.posts WHERE user_id = user3_id AND title = '선형 회귀 모델';
  
  -- 포스트 ID NULL 체크
  IF post1_id IS NULL OR post2_id IS NULL OR post3_id IS NULL OR post4_id IS NULL THEN
    RAISE EXCEPTION '사용자 1의 포스트 ID를 가져오지 못했습니다.';
  END IF;
  
  IF post5_id IS NULL OR post6_id IS NULL OR post7_id IS NULL THEN
    RAISE EXCEPTION '사용자 2의 포스트 ID를 가져오지 못했습니다.';
  END IF;
  
  IF post8_id IS NULL THEN
    RAISE EXCEPTION '사용자 3의 포스트 ID를 가져오지 못했습니다.';
  END IF;

  -- ============================================
  -- 5. AI Results (AI 처리 결과)
  -- ============================================
  INSERT INTO public.ai_results (post_id, summary, key_points, study_direction, raw_response)
  VALUES
    (
      post1_id,
      '정규화는 데이터베이스 설계에서 중복을 제거하고 데이터 무결성을 보장하는 과정입니다. 1NF부터 BCNF까지 단계적으로 정규화를 수행하여 이상 현상을 방지할 수 있습니다.',
      '["1NF (제1정규형)", "2NF (제2정규형)", "3NF (제3정규형)", "BCNF (Boyce-Codd 정규형)", "함수 종속", "이상 현상"]'::jsonb,
      '정규화 이론을 완전히 이해하기 위해 실제 데이터베이스 설계 예제를 통해 각 정규형을 단계적으로 적용해보세요. 특히 부분 함수 종속과 이행 함수 종속의 개념을 명확히 이해하는 것이 중요합니다.',
      '{"model": "gpt-4", "tokens": 150}'::jsonb
    ),
    (
      post2_id,
      '인덱스는 데이터베이스 성능 향상을 위한 핵심 요소입니다. 적절한 인덱스 설계와 쿼리 최적화를 통해 빠른 검색 속도를 달성할 수 있습니다.',
      '["B-Tree 인덱스", "Hash 인덱스", "Bitmap 인덱스", "쿼리 최적화", "EXPLAIN PLAN", "인덱스 성능"]'::jsonb,
      '실제 데이터베이스에서 EXPLAIN PLAN을 사용하여 쿼리 실행 계획을 분석하고, 인덱스가 제대로 활용되는지 확인해보세요. 또한 인덱스의 장단점을 이해하고 적절한 인덱스 전략을 수립하는 것이 중요합니다.',
      '{"model": "gpt-4", "tokens": 180}'::jsonb
    ),
    (
      post5_id,
      'React는 선언적 UI 라이브러리로, 컴포넌트 기반 개발을 통해 재사용 가능한 코드를 작성할 수 있습니다.',
      '["React 컴포넌트", "useState Hook", "useEffect Hook", "Props", "단방향 데이터 흐름", "JSX"]'::jsonb,
      '실제 프로젝트를 통해 React 컴포넌트를 만들고, 상태 관리를 연습해보세요. 특히 함수형 컴포넌트와 Hooks의 사용법을 익히는 것이 중요합니다.',
      '{"model": "gpt-4", "tokens": 120}'::jsonb
    ),
    (
      post8_id,
      '선형 회귀는 머신러닝의 가장 기본적인 알고리즘으로, 예측 모델링에 널리 사용됩니다.',
      '["선형 회귀", "최소 제곱법", "MSE", "RMSE", "R²", "다중 선형 회귀"]'::jsonb,
      'Python의 scikit-learn 라이브러리를 사용하여 선형 회귀 모델을 직접 구현해보세요. 실제 데이터셋에 적용하여 모델의 성능을 평가하고, 다양한 평가 지표의 의미를 이해하는 것이 중요합니다.',
      '{"model": "gpt-4", "tokens": 140}'::jsonb
    )
  ON CONFLICT (post_id) DO NOTHING;

  -- ============================================
  -- 6. Post Attachments (첨부 파일)
  -- ============================================
  INSERT INTO public.post_attachments (post_id, file_name, file_type, file_url, file_size, extracted_text)
  VALUES
    (
      post1_id,
      '정규화_예제.pdf',
      'pdf',
      'https://storage.supabase.co/object/public/attachments/normalization-example.pdf',
      245760,
      '정규화 예제: 학생 테이블을 1NF, 2NF, 3NF로 단계적으로 정규화하는 과정을 보여줍니다...'
    ),
    (
      post2_id,
      '인덱스_성능_분석.png',
      'image',
      'https://storage.supabase.co/object/public/attachments/index-performance.png',
      128000,
      NULL
    ),
    (
      post5_id,
      'React_컴포넌트_예제.pdf',
      'pdf',
      'https://storage.supabase.co/object/public/attachments/react-components.pdf',
      189440,
      'React 컴포넌트 예제 코드: useState와 useEffect를 사용한 카운터 컴포넌트...'
    )
  ON CONFLICT DO NOTHING;

END;
$$;

-- 함수 실행
SELECT insert_seed_data();

-- 함수 삭제 (선택사항 - 시드 데이터 삽입 후 정리)
-- DROP FUNCTION IF EXISTS insert_seed_data();

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '시드 데이터 삽입이 완료되었습니다!';
  RAISE NOTICE '생성된 데이터:';
  RAISE NOTICE '  - 사용자: 3명';
  RAISE NOTICE '  - 과목: 8개';
  RAISE NOTICE '  - 코스: 8개';
  RAISE NOTICE '  - 학습 노트: 8개';
  RAISE NOTICE '  - AI 결과: 4개';
  RAISE NOTICE '  - 첨부 파일: 3개';
END $$;
