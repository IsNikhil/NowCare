export const STOCK = {
  heroDoctor: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118',
  heroHospital: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3',
  heroPatientCalm: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
  heroConsult: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634',
  mapAbstract: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83',
  wellnessGreen: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597',
  emergencyRoom: 'https://images.unsplash.com/photo-1551076805-e1869033e561',
  heartbeatAbstract: 'https://images.unsplash.com/photo-1631217872822-1c2546d6b864',
  doctorAvatar1: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d',
  doctorAvatar2: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f',
  doctorAvatar3: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2',
  emptyResults: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7',
  patientProfile: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  landingBackground: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907',
} as const

export function stockUrl(key: keyof typeof STOCK, width: number): string {
  return `${STOCK[key]}?w=${width}&q=80&auto=format&fit=crop`
}
