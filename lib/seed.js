// Dummy fitness profiles seed data for Spottr
import { v4 as uuidv4 } from 'uuid'

const PHOTOS = [
  'https://images.unsplash.com/photo-1630857539167-e68ecccf3854',
  'https://images.unsplash.com/photo-1623010759866-91c6c657141e',
  'https://images.unsplash.com/photo-1620862161205-ad45a124805b',
  'https://images.pexels.com/photos/5937765/pexels-photo-5937765.jpeg',
  'https://images.pexels.com/photos/31500884/pexels-photo-31500884.jpeg',
  'https://images.unsplash.com/photo-1750521280541-bbf9d813a890',
  'https://images.unsplash.com/photo-1750521279808-f66baaed923d',
  'https://images.unsplash.com/photo-1485727749690-d091e8284ef3',
  'https://images.unsplash.com/photo-1750521280260-eff786c1a6af',
  'https://images.unsplash.com/photo-1689897229406-0f600543bb8d',
  'https://images.unsplash.com/photo-1606902965551-dce093cda6e7',
  'https://images.unsplash.com/photo-1545292736-65c19a25d18f',
  'https://images.unsplash.com/photo-1621750627159-cf77b0b91aac',
  'https://images.unsplash.com/photo-1516442719524-a603408c90cb',
  'https://images.unsplash.com/photo-1516442443906-71605254b628',
  'https://images.unsplash.com/photo-1763560066542-65c073e6a125',
  'https://images.unsplash.com/photo-1693214674472-dac7fbc2410d',
  'https://images.unsplash.com/photo-1649888216899-047093431441',
  'https://images.unsplash.com/photo-1744551358229-ef84be2f6b6b',
  'https://images.unsplash.com/photo-1689007669034-9ef988d89742',
  'https://images.unsplash.com/photo-1598890208253-b94e37923365',
  'https://images.unsplash.com/photo-1634276702982-3ba828ac4b7a',
  'https://images.unsplash.com/photo-1548690312-e3b507d8c110',
  'https://images.unsplash.com/photo-1709607012883-f56686091dbf',
  'https://images.unsplash.com/photo-1646613798518-d87b000104bf',
]

const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon']
const GYMS = ['Cult Fit', 'Gold\'s Gym', 'Anytime Fitness', 'Snap Fitness', 'Talwalkars', 'F45 Training', 'Fitness First', 'Crunch Fitness', 'PowerHouse Gym']
const GOALS = ['Muscle Gain', 'Weight Loss', 'Bulking', 'Leaning', 'Powerlifting', 'Cardio', 'General Fitness']
const TIMINGS = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Late Night']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const MEN = [
  { name: 'Arjun Mehta', age: 26, bio: 'Powerlifter chasing a 200kg deadlift. Looking for a serious training partner.', goal: 'Powerlifting', level: 'Advanced', insta: 'arjunlifts' },
  { name: 'Rohan Kapoor', age: 24, bio: 'Coffee \u2192 cardio \u2192 chest day. Consistency over intensity.', goal: 'Muscle Gain', level: 'Intermediate', insta: 'rohan.fit' },
  { name: 'Vikram Singh', age: 29, bio: 'Ex-cricketer. Switching to functional fitness. Need accountability.', goal: 'General Fitness', level: 'Intermediate', insta: 'vikramvfit' },
  { name: 'Aditya Sharma', age: 27, bio: 'Bulking season. 4000 cals/day. Bench bro wanted.', goal: 'Bulking', level: 'Advanced', insta: 'aditya_bulks' },
  { name: 'Karan Joshi', age: 23, bio: 'Beginner who actually shows up. Looking to learn proper form.', goal: 'Muscle Gain', level: 'Beginner', insta: 'karan.j' },
  { name: 'Siddharth Rao', age: 31, bio: 'CrossFit + Olympic lifts. WODs are better with company.', goal: 'General Fitness', level: 'Advanced', insta: 'sidrao.athletics' },
  { name: 'Nikhil Verma', age: 25, bio: 'Cutting for summer. Cardio sessions every morning at 6.', goal: 'Leaning', level: 'Intermediate' },
  { name: 'Aryan Iyer', age: 28, bio: 'Quiet lifter, big on technique. PPL split Mon\u2013Sat.', goal: 'Muscle Gain', level: 'Advanced', insta: 'aryanlifts' },
  { name: 'Devansh Patel', age: 22, bio: 'Marathon training + strength work. Looking for run + lift partner.', goal: 'Cardio', level: 'Intermediate' },
  { name: 'Manav Khurana', age: 30, bio: 'Recovering from injury, going slow & steady. Mobility first.', goal: 'General Fitness', level: 'Intermediate' },
  { name: 'Yash Bhatia', age: 26, bio: 'Gym is my therapy. Heavy compounds + good vibes only.', goal: 'Powerlifting', level: 'Advanced', insta: 'yash.heavy' },
  { name: 'Ishaan Malhotra', age: 24, bio: 'Hybrid athlete. Lift Mon/Wed/Fri, run Tue/Thu.', goal: 'General Fitness', level: 'Intermediate', insta: 'ishaan.athletics' },
]

const WOMEN = [
  { name: 'Aanya Kapoor', age: 25, bio: 'Pilates + strength. Looking for women-only workout buddies.', goal: 'Leaning', level: 'Intermediate', insta: 'aanya.moves' },
  { name: 'Priya Nair', age: 27, bio: 'First powerlifting meet in 8 weeks. Need spotters who get it.', goal: 'Powerlifting', level: 'Advanced', insta: 'priyalifts' },
  { name: 'Shruti Reddy', age: 23, bio: 'Marathon runner switching to hybrid training. 5am club.', goal: 'Cardio', level: 'Intermediate' },
  { name: 'Tanvi Shah', age: 26, bio: 'Building muscle, ditching the cardio bunny label.', goal: 'Muscle Gain', level: 'Intermediate', insta: 'tanvi.strong' },
  { name: 'Riya Khanna', age: 24, bio: 'Yoga teacher exploring weight training. Open to learning.', goal: 'General Fitness', level: 'Beginner', insta: 'riya.flow' },
  { name: 'Meera Gupta', age: 28, bio: 'Postpartum comeback. Patience + progression. Female partners only.', goal: 'Weight Loss', level: 'Beginner' },
  { name: 'Sanya Bose', age: 22, bio: 'College athlete. Volleyball + strength training.', goal: 'General Fitness', level: 'Advanced', insta: 'sanya.athletics' },
  { name: 'Aisha Rahman', age: 29, bio: 'CEO by day, lifter by 6am. Discipline > motivation.', goal: 'Muscle Gain', level: 'Intermediate', insta: 'aisha.iron' },
  { name: 'Naina Joshi', age: 25, bio: 'HIIT + boxing. High energy sessions only.', goal: 'Leaning', level: 'Intermediate' },
  { name: 'Pooja Singh', age: 30, bio: 'Strongwoman in training. Atlas stones > everything.', goal: 'Powerlifting', level: 'Advanced', insta: 'pooja.strong' },
  { name: 'Kavya Menon', age: 23, bio: 'Beginner, intimidated by free weights. Need a kind partner.', goal: 'Weight Loss', level: 'Beginner' },
  { name: 'Ananya Desai', age: 27, bio: 'Functional bodybuilding. Aesthetic + performance.', goal: 'Muscle Gain', level: 'Advanced', insta: 'ananya.builds' },
  { name: 'Diya Pillai', age: 26, bio: 'Crossfitter. Box jumps and burpees fan. Find me at 7am WOD.', goal: 'General Fitness', level: 'Advanced', insta: 'diya.wod' },
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

export function buildSeedProfiles() {
  const all = []
  let photoIdx = 0
  const make = (data, gender) => {
    const photos = []
    const count = rand(2, 4)
    for (let i = 0; i < count; i++) {
      photos.push(PHOTOS[photoIdx % PHOTOS.length] + '?w=900&auto=format&fit=crop')
      photoIdx++
    }
    return {
      id: uuidv4(),
      userId: null,
      isSeed: true,
      name: data.name,
      age: data.age,
      gender,
      city: pick(CITIES),
      gymName: pick(GYMS),
      level: data.level,
      goal: data.goal,
      timing: pick(TIMINGS),
      bio: data.bio,
      height: gender === 'Male' ? rand(170, 188) : rand(155, 175),
      weight: gender === 'Male' ? rand(65, 92) : rand(48, 72),
      instagram: data.insta || null,
      photos,
      verified: Math.random() > 0.45,
      verifications: {
        selfie: Math.random() > 0.5,
        instagram: !!data.insta,
        gym: Math.random() > 0.5,
      },
      online: Math.random() > 0.4,
      createdAt: new Date(),
    }
  }
  MEN.forEach(p => all.push(make(p, 'Male')))
  WOMEN.forEach(p => all.push(make(p, 'Female')))
  return all
}
