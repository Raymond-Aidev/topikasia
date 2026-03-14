/**
 * DB 초기화 스크립트 (마이그레이션 + 시딩)
 * - 수동 SQL 마이그레이션 4개 실행
 * - 어드민/시험세트/응시자 시드 데이터 투입 (이미 존재하면 스킵)
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/** Split SQL file into individual statements, respecting $$ blocks */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  for (const line of sql.split('\n')) {
    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 === 1) inDollarQuote = !inDollarQuote;

    current += line + '\n';

    if (!inDollarQuote && line.trimEnd().endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0 && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }

  const remaining = current.trim();
  if (remaining.length > 0) statements.push(remaining);
  return statements;
}

async function runMigrations() {
  const migrationDir = path.join(__dirname, 'sql');
  const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    console.log(`[Init] Running migration: ${file}`);
    const statements = splitSqlStatements(sql);
    try {
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
      console.log(`[Init] ✅ ${file} completed`);
    } catch (err) {
      // Ignore "already exists" errors
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
        console.log(`[Init] ⏭️ ${file} skipped (already applied)`);
      } else {
        console.error(`[Init] ⚠️ ${file} error:`, err.message);
      }
    }
  }
}

async function runSeed() {
  // Check if superadmin already exists
  const existing = await prisma.adminUser.findUnique({ where: { loginId: 'superadmin' } });
  if (existing) {
    console.log('[Init] ⏭️ Seed data already exists, skipping');
    return;
  }

  console.log('[Init] 🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('admin1234!', 10);

  // Admin users
  const superAdmin = await prisma.adminUser.create({
    data: { loginId: 'superadmin', passwordHash: adminPassword, name: '최고관리자', role: 'SUPER_ADMIN' },
  });
  await prisma.adminUser.create({
    data: { loginId: 'admin', passwordHash: adminPassword, name: '관리자', role: 'ADMIN' },
  });
  await prisma.adminUser.create({
    data: { loginId: 'proctor01', passwordHash: adminPassword, name: '감독관1', role: 'PROCTOR' },
  });
  await prisma.adminUser.create({
    data: { loginId: 'author01', passwordHash: adminPassword, name: '출제위원1', role: 'QUESTION_AUTHOR' },
  });

  // Exam sets
  const examSet1 = await prisma.examSet.create({
    data: {
      examSetNumber: 'TOPIK-000001',
      name: '2026년 제106회 TOPIK I 모의시험',
      examType: 'TOPIK_I',
      description: '시범 서비스 테스트용 모의시험 세트',
      status: 'ACTIVE',
      sectionsJson: {
        LISTENING: {
          section: 'LISTENING', durationMinutes: 40, questionCount: 30,
          questions: Array.from({ length: 30 }, (_, i) => ({
            bankId: `LISTEN_MCQ_${String(i + 1).padStart(3, '0')}`, typeCode: 'LISTEN_MCQ', questionIndex: i,
          })),
        },
        READING: {
          section: 'READING', durationMinutes: 60, questionCount: 40,
          questions: Array.from({ length: 40 }, (_, i) => ({
            bankId: `READ_MCQ_${String(i + 1).padStart(3, '0')}`, typeCode: 'READ_MCQ', questionIndex: i,
          })),
        },
      },
      uploadedById: superAdmin.id,
      uploadedAt: new Date(),
    },
  });

  const examSet2 = await prisma.examSet.create({
    data: {
      examSetNumber: 'TOPIK-000002',
      name: '2026년 제106회 TOPIK II 모의시험',
      examType: 'TOPIK_II',
      description: '시범 서비스 테스트용 TOPIK II 모의시험',
      status: 'ACTIVE',
      sectionsJson: {
        LISTENING: {
          section: 'LISTENING', durationMinutes: 60, questionCount: 50,
          questions: Array.from({ length: 50 }, (_, i) => ({
            bankId: `LISTEN2_MCQ_${String(i + 1).padStart(3, '0')}`, typeCode: 'LISTEN_MCQ', questionIndex: i,
          })),
        },
        WRITING: {
          section: 'WRITING', durationMinutes: 50, questionCount: 4,
          questions: [
            { bankId: 'WRITE_SHORT_001', typeCode: 'WRITE_SHORT', questionIndex: 0 },
            { bankId: 'WRITE_SHORT_002', typeCode: 'WRITE_SHORT', questionIndex: 1 },
            { bankId: 'WRITE_ESSAY_001', typeCode: 'WRITE_ESSAY', questionIndex: 2 },
            { bankId: 'WRITE_ESSAY_002', typeCode: 'WRITE_ESSAY', questionIndex: 3 },
          ],
        },
        READING: {
          section: 'READING', durationMinutes: 70, questionCount: 50,
          questions: Array.from({ length: 50 }, (_, i) => ({
            bankId: `READ2_MCQ_${String(i + 1).padStart(3, '0')}`, typeCode: 'READ_MCQ', questionIndex: i,
          })),
        },
      },
      uploadedById: superAdmin.id,
      uploadedAt: new Date(),
    },
  });

  // Test examinees
  const examPassword = await bcrypt.hash('test1234', 10);
  const admin = await prisma.adminUser.findUnique({ where: { loginId: 'admin' } });

  for (let i = 1; i <= 5; i++) {
    await prisma.examinee.create({
      data: {
        loginId: `test${String(i).padStart(2, '0')}`,
        passwordHash: examPassword,
        name: `테스트응시자${i}`,
        registrationNumber: `10000000${i}`,
        seatNumber: i,
        institutionName: 'TOPIK Asia 시험센터',
        examRoomName: '제1고사장',
        status: 'ACTIVE',
        assignedExamSetId: i <= 3 ? examSet1.id : examSet2.id,
        createdById: admin.id,
      },
    });
  }

  console.log('[Init] ✅ Seed complete');
  console.log('[Init] 어드민: superadmin/admin1234!, admin/admin1234!');
  console.log('[Init] 응시자: 100000001~5 / test1234');
}

/**
 * TOPIK 210 읽기 시험세트 시딩
 * topik_set1.json → ExamSet + ExamSchedule
 */
async function seedTopik210() {
  const EXAM_SET_NUMBER = 'TOPIK-210-R01';

  // 이미 존재하면 스킵
  const existing = await prisma.examSet.findUnique({ where: { examSetNumber: EXAM_SET_NUMBER } });
  if (existing) {
    console.log('[Init] ⏭️ TOPIK 210 읽기 시험세트 already exists, skipping');
    return;
  }

  // topik_set1.json 읽기
  const dataPath = path.join(__dirname, 'data', 'topik_set1.json');
  if (!fs.existsSync(dataPath)) {
    console.log('[Init] ⏭️ topik_set1.json not found, skipping TOPIK 210 seed');
    return;
  }

  const topikData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log('[Init] 🌱 Seeding TOPIK 210 읽기 시험세트...');

  // sectionsJson 구성: 채점에 필요한 correctAnswer, points, bankId, typeCode
  const questions = topikData.questionList.map((q, idx) => ({
    bankId: `TOPIK210_R_Q${String(q.questSeq).padStart(3, '0')}`,
    typeCode: 'READ_MCQ',
    questionIndex: idx,
    correctAnswer: q.correctAnswer,
    points: q.allot,
  }));

  const sectionsJson = {
    READING: {
      section: 'READING',
      durationMinutes: 40,
      questionCount: topikData.questionList.length,
      questions,
    },
  };

  // snapshotJson: topik210 원본 포맷 그대로 저장
  const snapshotJson = topikData;

  // 어드민 계정 조회 (uploadedById 용)
  const admin = await prisma.adminUser.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('[Init] ⚠️ SUPER_ADMIN not found, skipping TOPIK 210 seed');
    return;
  }

  // ExamSet + ExamSchedule 을 트랜잭션으로 원자적 생성
  await prisma.$transaction(async (tx) => {
    const examSet = await tx.examSet.create({
      data: {
        examSetNumber: EXAM_SET_NUMBER,
        name: '제210회 TOPIK I 읽기',
        examType: 'TOPIK_I',
        description: 'TOPIK I 읽기 영역 50문항 (2점×50=100점)',
        status: 'ACTIVE',
        sectionsJson,
        snapshotJson,
        uploadedById: admin.id,
        uploadedAt: new Date(),
      },
    });

    console.log(`[Init] ✅ ExamSet created: ${examSet.id} (${examSet.name})`);

    // ExamSchedule 생성 (접수 기간 = 응시 기간과 동일하게)
    // 2026-03-14 09:00 KST = 2026-03-14 00:00 UTC
    // 2026-04-15 17:00 KST = 2026-04-15 08:00 UTC
    await tx.$executeRaw`
      INSERT INTO "ExamSchedule" (
        "id", "examName", "examRound", "examType", "examDate",
        "registrationStartAt", "registrationEndAt",
        "venues", "maxCapacity", "currentCount", "status",
        "examSetId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        '제210회 TOPIK I 읽기',
        210,
        'TOPIK_I'::"ExamType",
        '2026-03-14'::timestamp,
        '2026-03-14T00:00:00Z'::timestamp,
        '2026-04-15T08:00:00Z'::timestamp,
        '[{"id":"online","name":"온라인","address":"온라인 응시","capacity":9999}]'::jsonb,
        9999,
        0,
        'OPEN'::"ScheduleStatus",
        ${examSet.id},
        NOW(),
        NOW()
      )
    `;

    console.log('[Init] ✅ ExamSchedule created for TOPIK 210 읽기');
  });
}

async function main() {
  try {
    await runMigrations();
    await runSeed();
    await seedTopik210();
  } catch (err) {
    console.error('[Init] Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
