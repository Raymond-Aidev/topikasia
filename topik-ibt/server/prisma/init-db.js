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

async function runMigrations() {
  const migrationDir = path.join(__dirname, 'migrations', 'manual');
  const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    console.log(`[Init] Running migration: ${file}`);
    try {
      await prisma.$executeRawUnsafe(sql);
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

async function main() {
  try {
    await runMigrations();
    await runSeed();
  } catch (err) {
    console.error('[Init] Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
