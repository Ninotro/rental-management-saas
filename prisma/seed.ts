import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Inizio seeding del database...')

  // Crea un utente admin di default
  const hashedPassword = await hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('Utente admin creato:', admin.email)

  // Crea un utente manager di esempio
  const managerPassword = await hash('manager123', 12)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      name: 'Manager Demo',
      role: 'MANAGER',
      active: true,
    },
  })

  console.log('Utente manager creato:', manager.email)

  // Crea un utente staff di esempio
  const staffPassword = await hash('staff123', 12)

  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password: staffPassword,
      name: 'Staff Demo',
      role: 'STAFF',
      active: true,
    },
  })

  console.log('Utente staff creato:', staff.email)

  // Crea alcune proprietà di esempio
  const property1 = await prisma.property.create({
    data: {
      name: 'Appartamento Centro Storico',
      address: 'Via Roma 123',
      city: 'Roma',
      country: 'Italia',
      description: 'Bellissimo appartamento nel cuore del centro storico',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      active: true,
    },
  })

  console.log('Proprietà creata:', property1.name)

  const property2 = await prisma.property.create({
    data: {
      name: 'Villa al Mare',
      address: 'Lungomare 45',
      city: 'Positano',
      country: 'Italia',
      description: 'Villa con vista mozzafiato sul mare',
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      active: true,
    },
  })

  console.log('Proprietà creata:', property2.name)

  console.log('Seeding completato!')
  console.log('\nCredenziali di accesso:')
  console.log('Admin - Email: admin@example.com, Password: admin123')
  console.log('Manager - Email: manager@example.com, Password: manager123')
  console.log('Staff - Email: staff@example.com, Password: staff123')
}

main()
  .catch((e) => {
    console.error('Errore durante il seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
