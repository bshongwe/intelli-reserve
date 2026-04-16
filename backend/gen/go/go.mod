module github.com/intelli-reserve/backend/gen/go

go 1.23

require (
	github.com/intelli-reserve/backend/gen/go/common v0.0.0
	github.com/intelli-reserve/backend/gen/go/notification v0.0.0
	github.com/intelli-reserve/backend/gen/go/analytics v0.0.0
	github.com/intelli-reserve/backend/gen/go/booking v0.0.0
	github.com/intelli-reserve/backend/gen/go/services v0.0.0
	github.com/intelli-reserve/backend/gen/go/inventory v0.0.0
	github.com/intelli-reserve/backend/gen/go/identity v0.0.0
)

replace github.com/intelli-reserve/backend/gen/go/common => ./common
replace github.com/intelli-reserve/backend/gen/go/notification => ./notification
replace github.com/intelli-reserve/backend/gen/go/analytics => ./analytics
replace github.com/intelli-reserve/backend/gen/go/booking => ./booking
replace github.com/intelli-reserve/backend/gen/go/services => ./services
replace github.com/intelli-reserve/backend/gen/go/inventory => ./inventory
replace github.com/intelli-reserve/backend/gen/go/identity => ./identity
