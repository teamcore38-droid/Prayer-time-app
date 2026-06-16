const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Standard connection string bypassing SRV lookup
const uri = 'mongodb://teamcore38_db_user:aLiCwbF7Ws1fU88m@ac-fovinvz-shard-00-00.kmm0oht.mongodb.net:27017,ac-fovinvz-shard-00-01.kmm0oht.mongodb.net:27017,ac-fovinvz-shard-00-02.kmm0oht.mongodb.net:27017/masjidconnect?ssl=true&replicaSet=atlas-obc0bo-shard-0&authSource=admin';

// Define schemas
const MosqueSchema = new mongoose.Schema({
  mosqueName: String,
  address: String,
  city: String,
  district: String,
  country: String,
  phone: String,
  email: String,
  logo: String,
  latitude: Number,
  longitude: Number,
  jumuahSessions: [{
    sessionNumber: Number,
    khutbah: String,
    iqamah: String
  }]
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'community_user' },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque', default: null }
}, { timestamps: true });

const TimePairSchema = new mongoose.Schema({
  adhan: String,
  iqamah: String
}, { _id: false });

const PrayerTimeSchema = new mongoose.Schema({
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  sunrise: String,
  fajr: TimePairSchema,
  dhuhr: TimePairSchema,
  asr: TimePairSchema,
  maghrib: TimePairSchema,
  isha: TimePairSchema
}, { timestamps: true });

PrayerTimeSchema.index({ mosqueId: 1, date: 1 }, { unique: true });

const Mosque = mongoose.models.Mosque || mongoose.model('Mosque', MosqueSchema, 'mosques');
const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
const PrayerTime = mongoose.models.PrayerTime || mongoose.model('PrayerTime', PrayerTimeSchema, 'prayertimes');

async function run() {
  try {
    console.log('Connecting to database using standard connection string...');
    await mongoose.connect(uri);
    console.log('Connected successfully to MongoDB Atlas.');

    // 3. Create or find default Sri Lankan Mosque
    console.log('Setting up Colombo Grand Mosque...');
    let mosque = await Mosque.findOne({ mosqueName: 'Colombo Grand Mosque' });
    if (!mosque) {
      mosque = await Mosque.create({
        mosqueName: 'Colombo Grand Mosque',
        address: '152 New Moor Street, Colombo 12',
        city: 'Colombo',
        district: 'Colombo',
        country: 'Sri Lanka',
        phone: '+94 11 234 5678',
        email: 'info@colombomasjid.lk',
        logo: '',
        latitude: 6.9406,
        longitude: 79.8569,
        jumuahSessions: [
          { sessionNumber: 1, khutbah: '12:15 PM', iqamah: '12:30 PM' },
          { sessionNumber: 2, khutbah: '01:15 PM', iqamah: '01:30 PM' }
        ]
      });
      console.log('Mosque created successfully.');
    } else {
      console.log('Mosque already exists.');
    }

    // 4. Create or update Imam (admin credentials)
    console.log('Setting up Imam user account...');
    const email = 'imam@colombomasjid.lk';
    const passwordText = 'colombomasjid123';
    
    let imam = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(passwordText, 10);

    if (!imam) {
      imam = await User.create({
        name: 'Imam Farhan',
        email: email,
        password: hashedPassword,
        role: 'mosque_admin',
        mosqueId: mosque._id
      });
      console.log(`Imam account created. Credentials:`);
      console.log(`- Email: ${email}`);
      console.log(`- Password: ${passwordText}`);
    } else {
      imam.role = 'mosque_admin';
      imam.mosqueId = mosque._id;
      imam.password = hashedPassword;
      await imam.save();
      console.log('Imam account updated with active credentials.');
    }

    // 5. Generate Prayer Times for current and next month
    console.log('Generating sample prayer times (10-minute Iqamah buffers)...');
    
    // We will populate all days for the current year-month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    
    // Run for current month and next month
    for (let mOffset = 0; mOffset <= 1; mOffset++) {
      const targetMonthDate = new Date(year, month + mOffset, 1);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();
      
      const numDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      console.log(`Seeding ${numDays} days for ${targetYear}-${String(targetMonth + 1).padStart(2, '0')}...`);
      
      for (let day = 1; day <= numDays; day++) {
        const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Define Sri Lankan Adhan Times (with slight random variation to look natural)
        // Fajr ~04:45, Dhuhr ~12:15, Asr ~15:45, Maghrib ~18:30, Isha ~19:45
        // Iqamah: Adhan + 10 minutes
        const minuteOffset = (day % 5) - 2; // -2 to +2 minutes shift per day for realistic looks
        
        const formatTime = (hour, min) => {
          const m = min + minuteOffset;
          const mFinal = m < 0 ? 60 + m : m >= 60 ? m - 60 : m;
          const hFinal = m < 0 ? hour - 1 : m >= 60 ? hour + 1 : hour;
          
          let mm = String(mFinal).padStart(2, '0');
          let hh = String(hFinal).padStart(2, '0');
          return `${hh}:${mm}`;
        };

        const fAdhan = formatTime(4, 45);
        const fIqamah = formatTime(4, 55); // exactly 10 mins after
        
        const dAdhan = formatTime(12, 15);
        const dIqamah = formatTime(12, 25);
        
        const aAdhan = formatTime(15, 45);
        const aIqamah = formatTime(15, 55);
        
        const mAdhan = formatTime(18, 30);
        const mIqamah = formatTime(18, 40);
        
        const iAdhan = formatTime(19, 45);
        const iIqamah = formatTime(19, 55);

        const sunriseTime = formatTime(5, 54);

        await PrayerTime.findOneAndUpdate(
          { mosqueId: mosque._id, date: dateStr },
          {
            mosqueId: mosque._id,
            date: dateStr,
            sunrise: sunriseTime,
            fajr: { adhan: fAdhan, iqamah: fIqamah },
            dhuhr: { adhan: dAdhan, iqamah: dIqamah },
            asr: { adhan: aAdhan, iqamah: aIqamah },
            maghrib: { adhan: mAdhan, iqamah: mIqamah },
            isha: { adhan: iAdhan, iqamah: iIqamah }
          },
          { upsert: true, new: true }
        );
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Database seeding failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
