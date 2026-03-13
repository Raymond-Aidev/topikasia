import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/** topik210 JSON 파일에서 읽기 시험 데이터를 로드하여 ExamSet으로 변환 */
function loadTopik210Sets(topik210Dir: string) {
  const sets: Array<{
    setNumber: number;
    fileName: string;
    data: any;
  }> = [];

  for (let i = 1; i <= 10; i++) {
    const filePath = path.join(topik210Dir, `topik_set${i}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ topik_set${i}.json not found, skipping`);
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    sets.push({ setNumber: i, fileName: `topik_set${i}.json`, data: JSON.parse(raw) });
  }

  return sets;
}

/** topik210 JSON → ExamSet sectionsJson + snapshotJson 변환 */
function convertToExamSet(setNumber: number, data: any) {
  const questionList = data.questionList || [];
  const examTextList = data.examTextList || [];

  // sectionsJson: 읽기 섹션 구성 정보
  const sectionsJson = {
    READING: {
      section: 'READING',
      durationMinutes: 70,
      questionCount: questionList.length,
      questions: questionList.map((q: any, idx: number) => ({
        bankId: `TOPIK2_R_SET${String(setNumber).padStart(2, '0')}_Q${String(q.questSeq).padStart(3, '0')}`,
        typeCode: 'READ_MCQ',
        questionIndex: idx,
        correctAnswer: q.correctAnswer,
        points: q.allot || 2,
      })),
    },
  };

  // snapshotJson: 실제 문제 데이터 (시험 응시 시 사용)
  const snapshotJson = {
    examType: data.examType,
    examLevel: data.examLevel,
    examArea: data.examArea,
    questionList: questionList.map((q: any) => ({
      questSeq: q.questSeq,
      quest: q.quest,
      questExplain: q.questExplain,
      correctAnswer: q.correctAnswer,
      allot: q.allot,
      level: q.level,
      questType: q.questType,
      questSubType: q.questSubType,
      item: q.item,
    })),
    examTextList: examTextList.map((t: any) => ({
      startQuestSeq: t.startQuestSeq,
      endQuestSeq: t.endQuestSeq,
      title: t.title,
      textArea: t.textArea,
    })),
  };

  return { sectionsJson, snapshotJson };
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. Admin users
  // ═══════════════════════════════════════════════════════════════
  const adminPassword = await bcrypt.hash('admin1234!', 10);

  const superAdmin = await prisma.adminUser.upsert({
    where: { loginId: 'superadmin' },
    update: {},
    create: {
      loginId: 'superadmin',
      passwordHash: adminPassword,
      name: '최고관리자',
      role: 'SUPER_ADMIN',
    },
  });

  const admin = await prisma.adminUser.upsert({
    where: { loginId: 'admin' },
    update: {},
    create: {
      loginId: 'admin',
      passwordHash: adminPassword,
      name: '관리자',
      role: 'ADMIN',
    },
  });

  const proctor = await prisma.adminUser.upsert({
    where: { loginId: 'proctor01' },
    update: {},
    create: {
      loginId: 'proctor01',
      passwordHash: adminPassword,
      name: '감독관1',
      role: 'PROCTOR',
    },
  });

  const author = await prisma.adminUser.upsert({
    where: { loginId: 'author01' },
    update: {},
    create: {
      loginId: 'author01',
      passwordHash: adminPassword,
      name: '출제위원1',
      role: 'QUESTION_AUTHOR',
    },
  });

  console.log('✅ Admin users created');

  // ═══════════════════════════════════════════════════════════════
  // 2. 기존 테스트용 시험 세트 (TOPIK I / TOPIK II 더미)
  // ═══════════════════════════════════════════════════════════════
  const examSet = await prisma.examSet.upsert({
    where: { examSetNumber: 'TOPIK-000001' },
    update: {},
    create: {
      examSetNumber: 'TOPIK-000001',
      name: '2026년 제106회 TOPIK I 모의시험',
      examType: 'TOPIK_I',
      description: '시범 서비스 테스트용 모의시험 세트',
      status: 'ACTIVE',
      sectionsJson: {
        LISTENING: {
          section: 'LISTENING',
          durationMinutes: 40,
          questionCount: 30,
          questions: Array.from({ length: 30 }, (_, i) => ({
            bankId: `LISTEN_MCQ_${String(i + 1).padStart(3, '0')}`,
            typeCode: 'LISTEN_MCQ',
            questionIndex: i,
          })),
        },
        READING: {
          section: 'READING',
          durationMinutes: 60,
          questionCount: 40,
          questions: Array.from({ length: 40 }, (_, i) => ({
            bankId: `READ_MCQ_${String(i + 1).padStart(3, '0')}`,
            typeCode: 'READ_MCQ',
            questionIndex: i,
          })),
        },
      },
      uploadedById: superAdmin.id,
      uploadedAt: new Date(),
    },
  });

  const examSet2 = await prisma.examSet.upsert({
    where: { examSetNumber: 'TOPIK-000002' },
    update: {},
    create: {
      examSetNumber: 'TOPIK-000002',
      name: '2026년 제106회 TOPIK II 모의시험',
      examType: 'TOPIK_II',
      description: '시범 서비스 테스트용 TOPIK II 모의시험',
      status: 'ACTIVE',
      sectionsJson: {
        LISTENING: {
          section: 'LISTENING',
          durationMinutes: 60,
          questionCount: 50,
          questions: Array.from({ length: 50 }, (_, i) => ({
            bankId: `LISTEN2_MCQ_${String(i + 1).padStart(3, '0')}`,
            typeCode: 'LISTEN_MCQ',
            questionIndex: i,
          })),
        },
        WRITING: {
          section: 'WRITING',
          durationMinutes: 50,
          questionCount: 4,
          questions: [
            { bankId: 'WRITE_SHORT_001', typeCode: 'WRITE_SHORT', questionIndex: 0 },
            { bankId: 'WRITE_SHORT_002', typeCode: 'WRITE_SHORT', questionIndex: 1 },
            { bankId: 'WRITE_ESSAY_001', typeCode: 'WRITE_ESSAY', questionIndex: 2 },
            { bankId: 'WRITE_ESSAY_002', typeCode: 'WRITE_ESSAY', questionIndex: 3 },
          ],
        },
        READING: {
          section: 'READING',
          durationMinutes: 70,
          questionCount: 50,
          questions: Array.from({ length: 50 }, (_, i) => ({
            bankId: `READ2_MCQ_${String(i + 1).padStart(3, '0')}`,
            typeCode: 'READ_MCQ',
            questionIndex: i,
          })),
        },
      },
      uploadedById: superAdmin.id,
      uploadedAt: new Date(),
    },
  });

  console.log('✅ Exam sets (dummy) created');

  // ═══════════════════════════════════════════════════════════════
  // 3. TOPIK II 읽기 시험 세트 10개 (topik210 데이터)
  //    - 상시 응시 가능 (scheduledStartAt: null)
  //    - 실제 문제 데이터 포함 (snapshotJson)
  // ═══════════════════════════════════════════════════════════════
  const topik210Dir = path.resolve(__dirname, '../../../topik210');
  console.log(`\n📂 Loading topik210 from: ${topik210Dir}`);

  const topikSets = loadTopik210Sets(topik210Dir);
  console.log(`   Found ${topikSets.length} sets`);

  for (const { setNumber, fileName, data } of topikSets) {
    const examSetNumber = `TOPIK2-R-${String(setNumber).padStart(3, '0')}`;
    const { sectionsJson, snapshotJson } = convertToExamSet(setNumber, data);

    await prisma.examSet.upsert({
      where: { examSetNumber },
      update: {
        sectionsJson,
        snapshotJson,
        status: 'ACTIVE',
        uploadedAt: new Date(),
      },
      create: {
        examSetNumber,
        name: `TOPIK II 읽기 모의시험 제${setNumber}회`,
        examType: 'TOPIK_II',
        description: `TOPIK II 읽기 영역 모의시험 (${data.questionList?.length || 50}문항) - 상시 응시 가능`,
        status: 'ACTIVE',
        scheduledStartAt: null, // 상시 응시
        sectionsJson,
        snapshotJson,
        uploadedById: superAdmin.id,
        uploadedAt: new Date(),
      },
    });

    console.log(`   ✅ ${examSetNumber} - ${fileName} (${data.questionList?.length}문항)`);
  }

  console.log('✅ TOPIK II 읽기 시험 세트 10개 생성 완료');

  // ═══════════════════════════════════════════════════════════════
  // 4. ExamSchedule: 상시 시험 일정 (자가접수용)
  //    - ExamSchedule 테이블은 수동 마이그레이션(004)으로 생성됨
  //    - Prisma schema에 없으므로 raw SQL로 삽입
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📅 Creating ExamSchedule entries...');

  // 상시 응시 가능 일정 (읽기 모의시험)
  await prisma.$executeRaw`
    INSERT INTO "ExamSchedule" (
      id, "examName", "examRound", "examType", "examDate",
      "registrationStartAt", "registrationEndAt",
      venues, "maxCapacity", "currentCount", status,
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'TOPIK II 읽기 모의시험 (상시)',
      0,
      'TOPIK_II'::"ExamType",
      '2099-12-31 23:59:59+09',
      '2026-01-01 00:00:00+09',
      '2099-12-31 23:59:59+09',
      '[{"id":"online","name":"온라인 응시","address":"온라인","capacity":99999,"currentCount":0}]'::jsonb,
      99999, 0, 'OPEN'::"ScheduleStatus",
      NOW(), NOW()
    )
    ON CONFLICT DO NOTHING
  `;

  // 기존 시드 데이터도 유지 (106회, 107회)
  await prisma.$executeRaw`
    INSERT INTO "ExamSchedule" (
      id, "examName", "examRound", "examType", "examDate",
      "registrationStartAt", "registrationEndAt",
      venues, "maxCapacity", "currentCount", status,
      "createdAt", "updatedAt"
    ) VALUES
      (gen_random_uuid()::text, '2026년도 제106회 한국어능력시험', 106, 'TOPIK_I'::"ExamType",
       '2026-05-17 09:00:00+09', '2026-03-01 00:00:00+09', '2026-04-15 23:59:59+09',
       '[{"id":"v1","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0},{"id":"v2","name":"부산 TOPIK Asia 시험센터","address":"부산광역시 해운대구 센텀중앙로 55","capacity":150,"currentCount":0}]'::jsonb,
       350, 0, 'OPEN'::"ScheduleStatus", NOW(), NOW()),
      (gen_random_uuid()::text, '2026년도 제106회 한국어능력시험', 106, 'TOPIK_II'::"ExamType",
       '2026-05-17 14:00:00+09', '2026-03-01 00:00:00+09', '2026-04-15 23:59:59+09',
       '[{"id":"v1","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0},{"id":"v2","name":"부산 TOPIK Asia 시험센터","address":"부산광역시 해운대구 센텀중앙로 55","capacity":150,"currentCount":0}]'::jsonb,
       350, 0, 'OPEN'::"ScheduleStatus", NOW(), NOW()),
      (gen_random_uuid()::text, '2026년도 제107회 한국어능력시험', 107, 'TOPIK_I'::"ExamType",
       '2026-07-12 09:00:00+09', '2026-05-01 00:00:00+09', '2026-06-15 23:59:59+09',
       '[{"id":"v3","name":"서울 TOPIK Asia 시험센터","address":"서울특별시 강남구 테헤란로 123","capacity":200,"currentCount":0}]'::jsonb,
       200, 0, 'OPEN'::"ScheduleStatus", NOW(), NOW())
    ON CONFLICT DO NOTHING
  `;

  console.log('✅ ExamSchedule entries created');

  // ═══════════════════════════════════════════════════════════════
  // 5. Test examinees (5 examinees)
  // ═══════════════════════════════════════════════════════════════
  const examPassword = await bcrypt.hash('test1234', 10);

  const examinees = [];
  for (let i = 1; i <= 5; i++) {
    const examinee = await prisma.examinee.upsert({
      where: { registrationNumber: `10000000${i}` },
      update: {},
      create: {
        loginId: `test${String(i).padStart(2, '0')}`,
        passwordHash: examPassword,
        name: `테스트응시자${i}`,
        registrationNumber: `10000000${i}`,
        seatNumber: i,
        institutionName: 'TOPIK Asia 시험센터',
        examRoomName: '제1고사장',
        status: 'ACTIVE',
        assignedExamSetId: i <= 3 ? examSet.id : examSet2.id,
        createdById: admin.id,
      },
    });
    examinees.push(examinee);
  }

  console.log('✅ Test examinees created');

  // ═══════════════════════════════════════════════════════════════
  // 6. Summary
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 Seed Summary:');
  console.log('─────────────────────────────────────');
  console.log('어드민 계정:');
  console.log('  superadmin / admin1234!  (최고관리자)');
  console.log('  admin / admin1234!       (관리자)');
  console.log('  proctor01 / admin1234!   (감독관)');
  console.log('  author01 / admin1234!    (출제위원)');
  console.log('');
  console.log('시험 세트:');
  console.log('  TOPIK-000001 (TOPIK I 더미)');
  console.log('  TOPIK-000002 (TOPIK II 더미)');
  console.log('  TOPIK2-R-001 ~ TOPIK2-R-010 (TOPIK II 읽기 실제 문제 10세트, 상시)');
  console.log('');
  console.log('시험 일정:');
  console.log('  TOPIK II 읽기 모의시험 (상시) - 온라인 응시');
  console.log('  제106회 TOPIK I / II - 2026-05-17');
  console.log('  제107회 TOPIK I - 2026-07-12');
  console.log('');
  console.log('응시자 계정:');
  console.log('  수험번호: 100000001~3 / 비번: test1234 (TOPIK I)');
  console.log('  수험번호: 100000004~5 / 비번: test1234 (TOPIK II)');
  console.log('─────────────────────────────────────');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
