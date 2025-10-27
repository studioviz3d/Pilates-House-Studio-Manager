/**
 * =================================================================    
 * IMPORTANT: ACTION REQUIRED
 * =================================================================
 * This is a Cloud Function that runs on Google's servers, not in the browser.
 * You MUST deploy this function to your Firebase project for the multi-tenant
 * system and new user sign-ups to work correctly.
 *
 * --- DEPLOYMENT STEPS ---
 *
 * 1.  Install Firebase CLI:
 *     If you haven't already, install the Firebase command-line tools:
 *     `npm install -g firebase-tools`
 *
 * 2.  Login to Firebase:
 *     `firebase login`
 *
 * 3.  Initialize Firebase Functions in your project:
 *     - Open your terminal in the root directory of this web app.
 *     - Run: `firebase init functions`
 *     - Select "Use an existing project" and choose your Firebase project.
 *     - Choose "TypeScript" as the language.
 *     - Choose "Yes" to install dependencies with npm.
 *
 * 4.  Replace the placeholder `functions/src/index.ts`:
 *     Firebase will create a `functions` folder. Inside it, there's a
 *     `src` folder with an `index.ts` file. DELETE the contents of that
 *     file and PASTE ALL OF THIS CODE into it.
 *
 * 5.  Add Dependencies:
 *     - Navigate into the functions directory: `cd functions`
 *     - Install the Admin SDK: `npm install firebase-admin@^12.1.0` and `npm install firebase-functions@^5.0.1`
 *
 * 6.  Deploy the function:
 *     - From inside the `functions` directory, run:
 *     `firebase deploy --only functions`
 *
 * After deployment, every new user who signs up will trigger this function.
 * =================================================================
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const defaultClassTypes = [
    {
        id: "ct-private",
        name: "Private",
        abbreviation: "P",
        maxCapacity: 1,
        pricing: {
            Regular: { "1": 120, "5": 575, "10": 1100 },
            Master: { "1": 150, "5": 720, "10": 1400 },
        },
    },
    {
        id: "ct-duet",
        name: "Duet",
        abbreviation: "D",
        maxCapacity: 2,
        pricing: {
            Regular: { "1": 70, "5": 325, "10": 600 },
            Master: { "1": 90, "5": 425, "10": 800 },
        },
    },
    {
        id: "ct-group",
        name: "Group",
        abbreviation: "G",
        maxCapacity: 4,
        pricing: {
            Regular: { "1": 50, "5": 225, "10": 400 },
            Master: { "1": 65, "5": 300, "10": 550 },
        },
    },
];

const defaultStudioSettings = {
    currencySymbol: "$",
    language: "en-US",
    cancellationPolicyHours: 24,
    timezone: "America/New_York",
    paymentMethods: ["Credit Card", "Cash", "Bank Transfer"],
    notificationSettings: {
        lowPackageEmail: true,
        expiringPackageEmail: true,
        upcomingBirthdayEmail: true,
    },
    inactivityThresholdDays: 90,
};


export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { email, uid } = user;
    const logger = functions.logger;

    logger.info(`New user signed up: ${email} (UID: ${uid}). No studio created automatically.`);
    return null;
});


export const createStudio = functions.https.onCall(async (data, context) => {
    const logger = functions.logger;

    // 1. Authentication Check: Ensure the caller is a super-admin
    if (context.auth?.token.role !== "super-admin") {
        logger.error("Unauthorized attempt to call createStudio by UID:", context.auth?.uid);
        throw new functions.https.HttpsError(
            "permission-denied",
            "You must be a super admin to perform this action."
        );
    }

    // 2. Data Validation
    const { studioName, adminName, adminEmail } = data;
    if (!studioName || !adminName || !adminEmail) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Studio name, admin name, and admin email are required."
        );
    }

    try {
        // 3. Generate a secure random password
        const initialPassword = Math.random().toString(36).slice(-10);

        // 4. Create the new admin user
        const userRecord = await admin.auth().createUser({
            email: adminEmail,
            password: initialPassword,
            displayName: adminName,
            emailVerified: true, // Assume verified since super-admin is creating it
        });

        logger.info(`Successfully created new admin user: ${userRecord.uid}`);

        // 5. Create the new studio document to get an ID
        const studioRef = admin.firestore().collection("studios").doc();
        const studioId = studioRef.id;

        // 6. Set custom claims for the new user
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            studioId: studioId,
            role: "admin",
        });

        logger.info(`Successfully set claims for user: ${userRecord.uid}`);

        // 7. Seed the new studio with default data
        const batch = admin.firestore().batch();

        // Set top-level studio document
        batch.set(studioRef, {
            name: studioName,
            adminEmail: adminEmail,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            settings: defaultStudioSettings,
            isArchived: false,
        });

        // Seed default class types
        const classTypesCollection = studioRef.collection("classTypes");
        defaultClassTypes.forEach((classType) => {
            const docRef = classTypesCollection.doc(classType.id);
            batch.set(docRef, classType);
        });

        await batch.commit();
        logger.info(`Successfully created studio ${studioId} and seeded initial data.`);

        // 8. Return success and the initial password
        return {
            success: true,
            message: `Studio '${studioName}' created successfully.`,
            initialPassword: initialPassword,
        };
    } catch (error: any) {
        logger.error("Error creating new studio:", error);
        if (error.code === "auth/email-already-exists") {
            throw new functions.https.HttpsError(
                "already-exists",
                "An account with this email already exists."
            );
        }
        throw new functions.https.HttpsError(
            "internal",
            "An unexpected error occurred. Please try again."
        );
    }
});


/**
 * Recursively deletes a collection in batches.
 */
async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy("__name__").limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve, reject);
    });
}

async function deleteQueryBatch(db: admin.firestore.Firestore, query: admin.firestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
    try {
        const snapshot = await query.get();

        const batchSize = snapshot.size;
        if (batchSize === 0) {
            // When there are no documents left, we are done
            resolve(true);
            return;
        }

        // Delete documents in a batch
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Recurse on the next process tick, to avoid hitting stack size limits
        setTimeout(() => {
            deleteQueryBatch(db, query, resolve, reject);
        }, 0);
    } catch (error) {
        reject(error);
    }
}

export const manageStudio = functions.https.onCall(async (data, context) => {
    const logger = functions.logger;

    // 1. Authentication Check
    if (context.auth?.token.role !== "super-admin") {
        logger.error("Unauthorized attempt to call manageStudio by UID:", context.auth?.uid);
        throw new functions.https.HttpsError("permission-denied", "You must be a super admin.");
    }

    // 2. Data Validation
    const { studioId, action } = data;
    if (!studioId || !action) {
        throw new functions.https.HttpsError("invalid-argument", "Studio ID and action are required.");
    }

    const studioRef = admin.firestore().collection("studios").doc(studioId);

    try {
        if (action === "archive") {
            await studioRef.update({ isArchived: true });
            return { success: true, message: "Studio archived successfully." };
        }

        if (action === "unarchive") {
            await studioRef.update({ isArchived: false });
            return { success: true, message: "Studio restored successfully." };
        }

        if (action === "delete") {
            const studioDoc = await studioRef.get();
            if (!studioDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Studio not found.");
            }
            const studioData = studioDoc.data();

            // Disable admin user first
            if (studioData && studioData.adminEmail) {
                try {
                    const user = await admin.auth().getUserByEmail(studioData.adminEmail);
                    await admin.auth().updateUser(user.uid, { disabled: true });
                    logger.info(`Disabled user ${user.uid} for deleted studio ${studioId}`);
                } catch (e) {
                    logger.error(`Could not find or disable user for email ${studioData.adminEmail}`, e);
                }
            }
            
            // Delete all subcollections recursively
            const subcollections = [
                "classTypes", "trainers", "customers", "bookings",
                "payments", "customerPayments", "advancePayments", "sessionDebts",
            ];
            for (const sub of subcollections) {
                await deleteCollection(admin.firestore(), `studios/${studioId}/${sub}`, 100);
                logger.info(`Deleted subcollection: ${sub} for studio ${studioId}`);
            }

            // Finally, delete the studio document itself
            await studioRef.delete();
            logger.info(`Successfully deleted studio document ${studioId}.`);
            
            return { success: true, message: "Studio and all its data have been permanently deleted." };
        }

        throw new functions.https.HttpsError("invalid-argument", "Invalid action specified.");
    } catch (error: any) {
        logger.error(`Error performing '${action}' on studio ${studioId}:`, error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});