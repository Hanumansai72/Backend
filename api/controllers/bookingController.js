const booking_service = require('../models/servicebooking');
const Vendor = require('../models/admin');
const Wallet = require('../models/wallet');
const { sendEmail } = require('../services/emailService');
const ErrorResponse = require('../utils/errorResponse');
const { ERROR_CODES } = require('../utils/errorCodes');

/**
 * Get booking location details
 */
exports.getBookingLocation = async (req, res) => {
    try {
        const id = req.params.id;
        const booking_find = await booking_service.findOne({ customerid: id });

        if (!booking_find) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'No booking found',
                    {},
                    404
                ).toJSON()
            );
        }

        res.json({
            success: true,
            address: booking_find.address,
            customer: booking_find.customer
        });
    } catch (err) {
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to fetch booking',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Get booked dates for vendor
 */
exports.getBookedDates = async (req, res) => {
    const id = req.params.id;

    try {
        const datedetauls = await booking_service.find(
            { Vendorid: id },
            { serviceDate: 1, serviceTime: 1 }
        );
        res.status(200).json(datedetauls);
    } catch (err) {
        res.status(500).json(err);
    }
};

/**
 * Get job history (completed jobs)
 */
exports.getJobHistory = async (req, res) => {
    const id = req.params.id;
    try {
        const databse1 = await booking_service.find({ Vendorid: id, status: 'Completed' });
        res.json(databse1);
    } catch (err) {
        console.error('Error fetching job history:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get new jobs for vendor (not completed)
 */
exports.getNewJobs = async (req, res) => {
    const id = req.params.id;
    try {
        const findingnewjob = await booking_service.find({
            Vendorid: id,
            status: { $ne: 'Completed' }
        });
        res.json(findingnewjob);
    } catch (err) {
        console.error('Error fetching new jobs:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get service count for vendor
 */
exports.getServiceCount = async (req, res) => {
    const id = req.params.id;
    try {
        const count1 = await booking_service.countDocuments({ Vendorid: id, status: 'Pending' });
        const count2 = await booking_service.countDocuments({ Vendorid: id, status: 'Completed' });
        const wallet = await Wallet.findOne({ vendorId: id });

        const count3 = wallet ? wallet.balance : 0;

        res.json({ count1: count1, count2: count2, count3: count3 });
    } catch (err) {
        console.error('Error fetching service count:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get service job by ID
 */
exports.getServiceJobById = async (req, res) => {
    const id = req.params.id;
    try {
        const findingserviceid = await booking_service.findById(id);
        res.json(findingserviceid);
    } catch (err) {
        console.error('Error fetching service job:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get cart services for customer
 */
exports.getCartServices = async (req, res) => {
    const id = req.params.id;
    try {
        const cartservice = await booking_service.find({ customerid: id });
        res.json(cartservice);
    } catch (err) {
        console.error('Error fetching cart services:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Get upcoming works for vendor
 */
exports.getUpcomingWorks = async (req, res) => {
    const id = req.params.id;

    try {
        const today = new Date();

        const works = await booking_service.find(
            {
                Vendorid: id,
                serviceDate: { $gte: today },
            },
            'serviceDate serviceTime'
        );

        if (!works || works.length === 0) {
            return res.json({ show_works: [] });
        }

        const show_works = works.map(job => {
            const dateObj = new Date(job.serviceDate);
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });

            return {
                date: formattedDate,
                time: job.serviceTime || 'N/A',
            };
        });

        res.json({ show_works });
    } catch (err) {
        console.error('❌ Error fetching upcoming works:', err);
        res
            .status(500)
            .json({ error: 'Server error while fetching upcoming works' });
    }
};

/**
 * Create new booking
 */
exports.createBooking = async (req, res) => {
    try {
        const booking = new booking_service(req.body);

        const { Vendorid, serviceDate, serviceTime, customer } = req.body;
        const { email, fullName } = customer;

        // Check for existing booking
        const existingBooking = await booking_service.findOne({
            Vendorid,
            serviceDate,
            serviceTime,
            status: { $in: ['Pending', 'Accepted', 'In Progress', 'Completed'] }
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }

        const idfind = await Vendor.findById(Vendorid);
        const vendorprice = idfind.Charge_Per_Hour_or_Day;
        if (!idfind) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'Vendor not found',
                    {},
                    404
                ).toJSON()
            );
        }

        const vendoremail = idfind.Email_address;
        const vendorname = idfind.Owner_name;

        await booking.save();

        try {
            const subject = 'Your Booking Successfully Placed';
            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Apna Mestri</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 0;">
  <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #007bff; color: #ffffff; border-radius: 8px 8px 0 0;">
        <h1>Apna Mestri</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <h2 style="color: #333;">Booking Confirmed 🎉</h2>
        <p style="color: #555;">Hello <strong>${fullName}</strong>,</p>
        <p style="color: #555;">Thank you for booking a vendor with <strong>Apna Mestri</strong>. Your request has been successfully placed.</p>
        <p style="color: #555;">Here are your booking details:</p>
        <ul style="color: #555;">
          <li><strong>Vendor Name:</strong> ${vendorname}</li>
          <li><strong>Date & Time:</strong> ${serviceDate} at ${serviceTime}</li>
        </ul>
        <p style="color: #555;">Our vendor will reach out to you shortly to confirm further details.</p>
        <p style="margin-top: 20px; text-align: center;">
          <a href="https://apnamestri.com" style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Booking</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 15px; text-align: center; background-color: #f1f1f1; color: #777; border-radius: 0 0 8px 8px;">
        <p>Thank you for choosing <strong>Apna Mestri</strong>.<br>We make services easier for you!</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

            await sendEmail(email, fullName, htmlContent, subject);

            const vendorSubject = 'New Booking Alert';
            const vendorContent = `
        <h3>Hello ${vendorname},</h3>
        <p>You have received a new booking from <b>${fullName}</b> on Apna Mestri.</p>
        <p><b>Date & Time:</b> ${serviceDate} at ${serviceTime}</p>
        <p>Please login to your dashboard for details.</p>
      `;
            await sendEmail(vendoremail, vendorname, vendorContent, vendorSubject);

        } catch (err) {
            console.log('Failed to send email', err);
        }

        res.status(200).json({ success: true, message: 'Booking saved successfully', booking, vendorprice });
    } catch (err) {
        console.error('Booking Save Error:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to save booking',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};

/**
 * Update booking status
 */
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body;
    try {
        // Verify ownership - vendor can only update their own bookings
        const booking = await booking_service.findById(req.params.id);
        if (!booking) {
            return res.status(404).json(
                new ErrorResponse(
                    ERROR_CODES.RESOURCE_NOT_FOUND,
                    'Booking not found',
                    {},
                    404
                ).toJSON()
            );
        }

        if (req.user.role !== 'admin' && booking.Vendorid?.toString() !== req.user.id) {
            return res.status(403).json(
                new ErrorResponse(
                    ERROR_CODES.FORBIDDEN,
                    'Access denied. You can only update your own bookings',
                    {},
                    403
                ).toJSON()
            );
        }

        const updatedBooking = await booking_service.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json({ success: true, booking: updatedBooking });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json(
            new ErrorResponse(
                ERROR_CODES.SERVER_ERROR,
                'Failed to update booking status',
                { error: err.message },
                500
            ).toJSON()
        );
    }
};
