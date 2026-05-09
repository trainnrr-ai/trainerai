// Realistic fitness profiles seed for Trainr — human bios, real personalities
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
const GYMS = ['Cult Fit', "Gold's Gym", 'Anytime Fitness', 'Snap Fitness', 'Talwalkars', 'F45 Training', 'Fitness First', 'Crunch Fitness', 'PowerHouse Gym']

const MEN = [
  { name: 'Arjun Mehta', age: 26, bio: 'Training for my first powerlifting competition in October. Need someone to spot heavy squats on Tuesdays and Saturdays.', goal: 'Powerlifting', level: 'Advanced', timing: 'Early Morning', insta: 'arjunlifts' },
  { name: 'Rohan Kapoor', age: 24, bio: 'Morning workouts before office keep me disciplined. Looking for a steady push/pull/legs partner who actually shows up.', goal: 'Muscle Gain', level: 'Intermediate', timing: 'Early Morning', insta: 'rohan.fit' },
  { name: 'Vikram Singh', age: 29, bio: "Ex-cricket player switching to functional training. Bad knees, good attitude. Patient partners welcome.", goal: 'General Fitness', level: 'Intermediate', timing: 'Evening', insta: 'vikramvfit' },
  { name: 'Aditya Sharma', age: 27, bio: 'Bulking season. 4000 cals a day, 5 sessions a week. Want a chest-day buddy who pushes me past my last set.', goal: 'Bulking', level: 'Advanced', timing: 'Evening', insta: 'aditya_bulks' },
  { name: 'Karan Joshi', age: 23, bio: "First-time at the gym, six months in, finally not embarrassed. Need someone patient who'll teach me good form.", goal: 'Muscle Gain', level: 'Beginner', timing: 'Evening' },
  { name: 'Siddharth Rao', age: 31, bio: "CrossFit + Olympic lifts. WODs are honestly better with company. Don't ghost on the 6am sessions.", goal: 'General Fitness', level: 'Advanced', timing: 'Early Morning', insta: 'sidrao.athletics' },
  { name: 'Nikhil Verma', age: 25, bio: 'Cutting for a wedding in March. Cardio every morning, lifting four days a week. Accountability > motivation.', goal: 'Leaning', level: 'Intermediate', timing: 'Early Morning' },
  { name: 'Aryan Iyer', age: 28, bio: 'Quiet lifter, big on technique. Looking for a serious partner for a structured PPL split, Monday to Saturday.', goal: 'Muscle Gain', level: 'Advanced', timing: 'Morning', insta: 'aryanlifts' },
  { name: 'Devansh Patel', age: 22, bio: 'Half-marathon training plus strength work. Long Sunday runs are better with someone who keeps the pace honest.', goal: 'Cardio', level: 'Intermediate', timing: 'Early Morning' },
  { name: 'Manav Khurana', age: 30, bio: 'Coming back after a herniated disc. Going slow, mobility-first. Looking for a chill partner who gets the journey.', goal: 'General Fitness', level: 'Intermediate', timing: 'Morning' },
  { name: 'Yash Bhatia', age: 26, bio: 'Gym is my therapy. Heavy compounds, no ego lifts, no podcast bros. Just show up and put in the work.', goal: 'Powerlifting', level: 'Advanced', timing: 'Late Night', insta: 'yash.heavy' },
  { name: 'Ishaan Malhotra', age: 24, bio: 'Hybrid athlete: lift Mon/Wed/Fri, run Tue/Thu. Looking for someone consistent who shares the same split.', goal: 'General Fitness', level: 'Intermediate', timing: 'Evening', insta: 'ishaan.athletics' },
]

const WOMEN = [
  { name: 'Aanya Kapoor', age: 25, bio: 'Pilates twice a week, lifting three times. Looking for women-only training partners I can actually trust.', goal: 'Leaning', level: 'Intermediate', timing: 'Morning', insta: 'aanya.moves' },
  { name: 'Priya Nair', age: 27, bio: "First powerlifting meet in 8 weeks. Need spotters who get the sport — not someone who'll mansplain my squat.", goal: 'Powerlifting', level: 'Advanced', timing: 'Evening', insta: 'priyalifts' },
  { name: 'Shruti Reddy', age: 23, bio: 'Marathon runner moving to hybrid training. 5am club, no excuses. Coffee after the run is non-negotiable.', goal: 'Cardio', level: 'Intermediate', timing: 'Early Morning' },
  { name: 'Tanvi Shah', age: 26, bio: 'Tired of the cardio-bunny label. Building real muscle this year. Looking for a women-only lifting partner.', goal: 'Muscle Gain', level: 'Intermediate', timing: 'Morning', insta: 'tanvi.strong' },
  { name: 'Riya Khanna', age: 24, bio: "Yoga teacher curious about weights. Equipment is intimidating — I'd love a kind partner who knows the basics.", goal: 'General Fitness', level: 'Beginner', timing: 'Morning', insta: 'riya.flow' },
  { name: 'Meera Gupta', age: 28, bio: "Postpartum comeback, eight months in. Trying to lose 15kg and stay accountable. Female partners only, please.", goal: 'Weight Loss', level: 'Beginner', timing: 'Afternoon' },
  { name: 'Sanya Bose', age: 22, bio: "College volleyball player. Off-season strength training. Looking for someone who matches my energy on conditioning days.", goal: 'General Fitness', level: 'Advanced', timing: 'Late Night', insta: 'sanya.athletics' },
  { name: 'Aisha Rahman', age: 29, bio: 'CEO by 9am, lifter by 6am. Discipline beats motivation every time. Looking for a serious morning partner.', goal: 'Muscle Gain', level: 'Intermediate', timing: 'Early Morning', insta: 'aisha.iron' },
  { name: 'Naina Joshi', age: 25, bio: 'HIIT + boxing four times a week. High-energy sessions only. If you skip warm-ups we won\u2019t get along.', goal: 'Leaning', level: 'Intermediate', timing: 'Evening' },
  { name: 'Pooja Singh', age: 30, bio: 'Strongwoman in training — atlas stones, log press, the works. Looking for partners who love the weird stuff.', goal: 'Powerlifting', level: 'Advanced', timing: 'Evening', insta: 'pooja.strong' },
  { name: 'Kavya Menon', age: 23, bio: "Trying to lose 15kg and stay accountable. Beginner, intimidated by the free-weights area. Looking for a kind, patient partner.", goal: 'Weight Loss', level: 'Beginner', timing: 'Morning' },
  { name: 'Ananya Desai', age: 27, bio: 'Functional bodybuilding — aesthetic + performance. Coached online. Looking for an in-person training friend.', goal: 'Muscle Gain', level: 'Advanced', timing: 'Evening', insta: 'ananya.builds' },
  { name: 'Diya Pillai', age: 26, bio: '7am CrossFit class regular. Box jumps, burpees, and bad music. Looking for someone who finishes the WOD with me.', goal: 'General Fitness', level: 'Advanced', timing: 'Early Morning', insta: 'diya.wod' },
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }

export function buildSeedProfiles() {
  const all = []
  let photoIdx = 0
  const make = (data, gender) => {
    const photos = []
    const count = rand(3, 5)
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
      timing: data.timing || pick(['Early Morning', 'Morning', 'Evening']),
      bio: data.bio,
      height: gender === 'Male' ? rand(170, 188) : rand(155, 175),
      weight: gender === 'Male' ? rand(65, 92) : rand(48, 72),
      instagram: data.insta || null,
      photos,
      verified: Math.random() > 0.4,
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
