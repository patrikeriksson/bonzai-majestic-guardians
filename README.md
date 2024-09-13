# Bonzai API

### Get all bookings

- GET https://your-aws-link-here/bookings

```
response:
{
	"data": {
		"bookings": [
			{
				"bookingNumber": "3b9db2ce-b414-4167-aad9-e593e2da91b2",
				"checkInDate": "2024-10-14",
				"checkOutDate": "2024-10-15",
				"numberOfGuests": 1,
				"singleRoom": 1,
				"doubleRoom": 0,
				"suite": 0,
				"fullName": "John Doe"
			}
		]
	}
}
```

### Create Booking

- POST https://your-aws-link-here/bookings

```
body:
{
  "numberOfGuests": 1,
  "singleRoom": 1,
  "doubleRoom": 0,
  "suite": 0,
  "checkInDate": "2024-10-14",
  "checkOutDate": "2024-10-15",
  "fullName": "John Doe",
  "email": "john.doe@example.com"
}
```

```
response:
{
	"data": {
		"message": "Booking created",
		"bookingId": "3b9db2ce-b414-4167-aad9-e593e2da91b2",
		"bookingInfo": {
			"numberOfGuests": 1,
			"singleRoom": 1,
			"doubleRoom": 0,
			"suite": 0,
			"checkInDate": "2024-10-14",
			"checkOutDate": "2024-10-15",
			"fullName": "John Doe",
			"email": "john.doe@example.com",
			"totalAmount": 500
		}
	}
}
```

### Update Booking

- UPDATE https://your-aws-link-here/bookings/{id}

```
body:
{
  "numberOfGuests": 4,
  "singleRoom": 4,
  "doubleRoom": 0,
  "suite": 0,
  "checkInDate": "2024-11-01",
  "checkOutDate": "2024-11-04"
}
```

```
response:
{
	"data": {
		"message": "Booking updated",
		"bookingId": "81ce5dd0-4443-4632-87df-72673ef1829f",
		"updatedBookingInfo": {
			"numberOfGuests": 4,
			"singleRoom": 4,
			"doubleRoom": 0,
			"suite": 0,
			"checkInDate": "2024-11-01",
			"checkOutDate": "2024-11-04",
			"totalAmount": 6000
		}
	}
}
```

### Delete Booking

- DELETE https://your-aws-link-here/bookings/{id}

```
response:
{
	"data": {
		"message": "Booking with ID 3b9db2ce-b414-4167-aad9-e593e2da91b2 deleted successfully"
	}
}
You cannot delete a booking within 2 days of check-in.
```
