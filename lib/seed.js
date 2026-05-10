// Realistic fitness profiles seed for Trainr — human bios, real personalities
import { v4 as uuidv4 } from 'uuid'

// Curated REALISTIC Indian fitness profile photos.
// Frozen set — DO NOT regenerate to save credits. One photo per seeded profile.
const PHOTOS_MEN = [
  'https://images.pexels.com/photos/23939733/pexels-photo-23939733.jpeg',
  'https://images.pexels.com/photos/13278075/pexels-photo-13278075.jpeg',
  'https://images.pexels.com/photos/23158705/pexels-photo-23158705.jpeg',
  'https://images.pexels.com/photos/17559309/pexels-photo-17559309.jpeg',
  'https://images.pexels.com/photos/11805574/pexels-photo-11805574.jpeg',
  'https://images.pexels.com/photos/6514823/pexels-photo-6514823.jpeg',
  'https://images.unsplash.com/photo-1693214099505-aadb39c60c90',
  'https://images.unsplash.com/photo-1630065612426-e03d3fec7348',
  'https://images.unsplash.com/photo-1630065612874-b0c19e95d30c',
  'https://images.pexels.com/photos/5221029/pexels-photo-5221029.jpeg',
  'https://images.pexels.com/photos/11800270/pexels-photo-11800270.jpeg',
  'https://images.pexels.com/photos/13767451/pexels-photo-13767451.jpeg',
  'https://images.pexels.com/photos/30283463/pexels-photo-30283463.jpeg',
]
const PHOTOS_WOMEN = [
  'https://images.pexels.com/photos/13534122/pexels-photo-13534122.jpeg',
  'https://images.pexels.com/photos/14591533/pexels-photo-14591533.jpeg',
  'https://images.pexels.com/photos/14591532/pexels-photo-14591532.jpeg',
  'https://images.pexels.com/photos/14541139/pexels-photo-14541139.jpeg',
  'https://images.pexels.com/photos/29259712/pexels-photo-29259712.jpeg',
  'https://images.pexels.com/photos/31500885/pexels-photo-31500885.jpeg',
  'https://images.pexels.com/photos/31500878/pexels-photo-31500878.jpeg',
  'https://images.pexels.com/photos/24244667/pexels-photo-24244667.jpeg',
  'https://images.pexels.com/photos/37208480/pexels-photo-37208480.jpeg',
  'https://images.pexels.com/photos/34587497/pexels-photo-34587497.jpeg',
  'https://images.pexels.com/photos/24243301/pexels-photo-24243301.jpeg',
  'https://images.pexels.com/photos/31500872/pexels-photo-31500872.jpeg',
  'https://images.unsplash.com/photo-1718633599488-73f87e623317',
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
  let menIdx = 0, womenIdx = 0
  const make = (data, gender) => {
    const pool = gender === 'Male' ? PHOTOS_MEN : PHOTOS_WOMEN
    const i = gender === 'Male' ? menIdx++ : womenIdx++
    const photo = pool[i % pool.length] + '?w=900&auto=format&fit=crop'
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
      photos: [photo],
      verified: Math.random() > 0.4,
      verifications: { selfie: Math.random() > 0.5, instagram: !!data.insta, gym: Math.random() > 0.5 },
      online: Math.random() > 0.4,
      createdAt: new Date(),
    }
  }
  MEN.forEach(p => all.push(make(p, 'Male')))
  WOMEN.forEach(p => all.push(make(p, 'Female')))
  return all
}
