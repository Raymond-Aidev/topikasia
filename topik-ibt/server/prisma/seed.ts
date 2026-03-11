import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Admin users
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

  // 2. Exam Set (ACTIVE, with sections)
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

  console.log('✅ Exam sets created');

  // 3. Test examinees (5 examinees)
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

  // 4. Summary
  console.log('\n📋 Test Account Summary:');
  console.log('─────────────────────────────────────');
  console.log('어드민 계정:');
  console.log('  superadmin / admin1234!  (최고관리자)');
  console.log('  admin / admin1234!       (관리자)');
  console.log('  proctor01 / admin1234!   (감독관)');
  console.log('  author01 / admin1234!    (출제위원)');
  console.log('');
  console.log('응시자 계정:');
  console.log('  수험번호: 100000001 / 비번: test1234 (TOPIK I)');
  console.log('  수험번호: 100000002 / 비번: test1234 (TOPIK I)');
  console.log('  수험번호: 100000003 / 비번: test1234 (TOPIK I)');
  console.log('  수험번호: 100000004 / 비번: test1234 (TOPIK II)');
  console.log('  수험번호: 100000005 / 비번: test1234 (TOPIK II)');
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
