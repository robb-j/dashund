# Ideas

## Grouped token refreshing

We need a way of queueing/bunching up token refreshes (a global store of refresh promises?) so multiple refreshes don't overwrite each other.

If 3 endpoints use the same token and it has expired, they'll each try to refresh.
The process may destroy the old tokens. Some of the requests may fail and leave the token store in an unknown state.

## `.dashund` folder name

What should the name of the folder be, should it be a 'hidden' folder?

## CLI resource created confirmation

Say something nice when a resource was created,
to confirm everything went ok

## CLI usage review

People don't want to learn a CLI.
It should be interactive by default, with non-interactive as an option?
So you don't have to learn the CLI.

## Handle axios errors

Endpoints could look for axios-thrown errors and coerce what went wrong
from the `response.status` field
