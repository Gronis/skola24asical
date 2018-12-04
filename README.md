# Skola24 as ical

This service is hosted at [https://skola24.robingronberg.se](https://skola24.robingronberg.se)

It is build using docker (for hosting) and nodejs

I made this for my brother so that he is not forced to add the entries manually from skola24.

## Usage:
```web
https://skola24.robingronberg.se/schedule/:domain/:schoolGuid/:groupGuid
```
Use your local skola24.se web view to find out your specific domain, schoolGuid and groupGuid
### Example:
```web
https://skola24.robingronberg.se/schedule/goteborg.skola24.se/c7a07cfd-25b1-439d-a37c-10638e2be616/a9ff834a-dcdf-4e39-afdb-583f7e6c58d1
```
where
```yml
domain: "goteborg.skola24"
schoolGuid: "c7a07cfd-25b1-439d-a37c-10638e2be616"
grouGuid: "a9ff834a-dcdf-4e39-afdb-583f7e6c58d1"
```

## Note:
* The current implementation does not support "collisions" in schedule.
* Odd things will probably happen when the new year is approaching

## License
Licensed under MIT License

I would be happy if you contribute! Just send me a pull request!

## TODO

* Make a tutorial like homepage how to use the service (with buttons to select school, class, etc)
* Add support for schedules with collisions
* (Fixed) When close to a new year, add support to search for week 1+ (instead of 53+, which do not exist)
