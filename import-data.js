const fs = require('fs');
const csv = require('csv-parser');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAXtcE81qnjjkdNTjccy0QATbu1m98M0dk",
    authDomain: "health-tracker-4075c.firebaseapp.com",
    projectId: "health-tracker-4075c",
    storageBucket: "health-tracker-4075c.firebasestorage.app",
    messagingSenderId: "281593784734",
    appId: "1:281593784734:web:5c0ed6eb8cc164bb99ce8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importHealthData() {
    const results = [];
    
    console.log('Reading CSV file...');
    
    return new Promise((resolve, reject) => {
        fs.createReadStream('Health Data_rows.csv')
            .pipe(csv())
            .on('data', (data) => {
                // Process each row
                const date = data.date.split(' ')[0]; // Extract just the date part (YYYY-MM-DD)
                
                // Convert empty strings to null
                const weight = data.weight && data.weight.trim() !== '' ? parseFloat(data.weight) : null;
                const waist = data.waist && data.waist.trim() !== '' ? parseFloat(data.waist) : null;
                const systolic = data.systolic && data.systolic.trim() !== '' ? parseInt(data.systolic) : null;
                const diastolic = data.diastolic && data.diastolic.trim() !== '' ? parseInt(data.diastolic) : null;
                const notes = data.notes && data.notes.trim() !== '' ? data.notes.trim() : null;
                
                // Only include records that have at least one measurement
                if (weight !== null || waist !== null || (systolic !== null && diastolic !== null)) {
                    results.push({
                        date: date,
                        weight: weight,
                        waist: waist,
                        systolic: systolic,
                        diastolic: diastolic,
                        notes: notes,
                        timestamp: new Date() // Use current timestamp as serverTimestamp equivalent
                    });
                }
            })
            .on('end', async () => {
                console.log(`Processed ${results.length} valid records from CSV`);
                
                try {
                    // Upload to Firestore in batches
                    const batchSize = 50;
                    let uploadedCount = 0;
                    
                    for (let i = 0; i < results.length; i += batchSize) {
                        const batch = results.slice(i, i + batchSize);
                        
                        console.log(`Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(results.length/batchSize)}...`);
                        
                        const promises = batch.map(async (record, index) => {
                            // Use a combination of date and index to ensure unique document IDs
                            const docId = `${record.date}_${String(i + index).padStart(4, '0')}`;
                            const docRef = doc(collection(db, 'healthData'), docId);
                            
                            return setDoc(docRef, record);
                        });
                        
                        await Promise.all(promises);
                        uploadedCount += batch.length;
                        console.log(`Uploaded ${uploadedCount}/${results.length} records`);
                        
                        // Small delay between batches to avoid rate limiting
                        if (i + batchSize < results.length) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                    
                    console.log('✅ Successfully imported all health data!');
                    console.log(`📊 Total records imported: ${uploadedCount}`);
                    console.log(`📅 Date range: ${results[0].date} to ${results[results.length-1].date}`);
                    
                    // Show summary statistics
                    const weightRecords = results.filter(r => r.weight !== null).length;
                    const waistRecords = results.filter(r => r.waist !== null).length;
                    const bpRecords = results.filter(r => r.systolic !== null && r.diastolic !== null).length;
                    
                    console.log(`\n📈 Data summary:`);
                    console.log(`  Weight measurements: ${weightRecords}`);
                    console.log(`  Waist measurements: ${waistRecords}`);
                    console.log(`  Blood pressure measurements: ${bpRecords}`);
                    
                    resolve();
                } catch (error) {
                    console.error('❌ Error uploading to Firestore:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('❌ Error reading CSV:', error);
                reject(error);
            });
    });
}

// Run the import
importHealthData()
    .then(() => {
        console.log('\n🎉 Import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Import failed:', error);
        process.exit(1);
    });