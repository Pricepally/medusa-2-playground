// import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

// export class PhoneUtil {
//   private static phoneUtil = PhoneNumberUtil.getInstance();

//   /**
//    * Validate and format a phone number
//    * @param phoneNumber - The phone number to validate (e.g., "08165488599")
//    * @param countryCode - The country code (e.g., "NG")
//    * @returns Object with validation result and formatted number
//    */
//   static validateAndFormat(
//     phoneNumber: string,
//     countryCode: string
//   ): {
//     isValid: boolean;
//     formattedNumber?: string;
//     error?: string;
//     e164?: string;
//   } {
//     try {
//       // Parse the phone number
//       const parsedNumber = this.phoneUtil.parse(phoneNumber, countryCode);

//       // Check if the number is valid
//       const isValid = this.phoneUtil.isValidNumber(parsedNumber);

//       if (!isValid) {
//         return {
//           isValid: false,
//           error: 'Invalid phone number for the specified country',
//         };
//       }

//       // Format the number in international format
//       const formattedNumber = this.phoneUtil.format(
//         parsedNumber,
//         PhoneNumberFormat.INTERNATIONAL
//       );

//       // Get E.164 format (e.g., +2348165488599)
//       const e164 = this.phoneUtil.format(parsedNumber, PhoneNumberFormat.E164);

//       return {
//         isValid: true,
//         formattedNumber,
//         e164,
//       };
//     } catch (error) {
//       return {
//         isValid: false,
//         error: `Phone validation error: ${error.message}`,
//       };
//     }
//   }

//   /**
//    * Extract country code from phone number if not provided
//    * @param phoneNumber - The phone number
//    * @returns Country code if detectable
//    */
//   static extractCountryCode(phoneNumber: string): string | null {
//     try {
//       // If number starts with +, try to parse without country code
//       if (phoneNumber.startsWith('+')) {
//         const parsedNumber = this.phoneUtil.parse(phoneNumber, 'ZZ'); // ZZ is for unknown region
//         const countryCode = this.phoneUtil.getRegionCodeForNumber(parsedNumber);
//         return countryCode;
//       }
//       return null;
//     } catch (error) {
//       return null;
//     }
//   }

//   /**
//    * Check if a string is a valid email address
//    * @param email - Email address to validate
//    * @returns Boolean indicating if email is valid
//    */
//   static isValidEmail(email: string): boolean {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   } // this is a phone util why do we need this method?

//   /**
//    * Determine identifier type based on the input
//    * @param identifier - The identifier to check
//    * @returns 'email' or 'phone'
//    */
//   static getIdentifierType(identifier: string): 'email' | 'phone' {
//     return this.isValidEmail(identifier) ? 'email' : 'phone';
//   } // why is this necessary?
// }
