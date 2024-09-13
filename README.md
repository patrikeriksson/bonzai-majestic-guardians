# Bonzai API

### Get all bookings

- GET https://your-aws-link-here/bookings

```
response:
{
	"data": {
		"bookings": [
			{
				"bookingNumber": "ed82cf34-d263-4ccb-80a8-80698b6a50f5",
				"checkInDate": "2024-09-13",
				"checkOutDate": "2024-09-14",
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
  "checkInDate": "2024-09-13",
  "checkOutDate": "2024-09-14",
  "fullName": "John Doe",
  "email": "john.doe@example.com"
}
```

```
response:
{
	"data": {
		"message": "Booking created",
		"bookingId": "ed82cf34-d263-4ccb-80a8-80698b6a50f5",
		"bookingInfo": {
			"numberOfGuests": 1,
			"singleRoom": 1,
			"doubleRoom": 0,
			"suite": 0,
			"checkInDate": "2024-09-13",
			"checkOutDate": "2024-09-14",
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
  "numberOfGuests": 2,
  "singleRoom": 2,
  "doubleRoom": 0,
  "suite": 0,
  "checkInDate": "2024-11-01",
  "checkOutDate": "2024-11-04"
}
```

```
response:

```

### Delete Booking

- DELETE https://your-aws-link-here/bookings/{id}

```
response:
{
	"data": {
		"message": "Booking with ID "{id}" deleted successfully"
	}
}
```
