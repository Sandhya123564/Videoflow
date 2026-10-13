# Database schema

All collections live in the `videoflow` database on MongoDB Atlas.

## Relationships

```
User 1──* Project (as editor)
User 0──* Project (as reviewer / head)
Project 1──* VideoVersion
Project 1──* Comment
Project 1──* Approval
Project 1──* Notification
Project 1──* PublishingRecord
VideoVersion 1──* Comment
```

## Users

| Field | Type | Notes |
|-------|------|--------|
| name | string | required |
| email | string | unique, lowercase |
| passwordHash | string | bcrypt, hidden by default |
| role | enum | editor \| reviewer \| head \| admin |
| isActive | boolean | default true |
| youtube | object | OAuth tokens for publishing (Phase 5) |
| timestamps | date | createdAt, updatedAt |

## Projects

| Field | Type | Notes |
|-------|------|--------|
| title, description | string | |
| editor | ObjectId → User | required |
| reviewerEmail | string | invitation target |
| reviewer, head | ObjectId → User | optional until assigned |
| status | enum | see architecture status machine |
| currentVersion | ObjectId → VideoVersion | |
| driveLink | string | optional source |
| youtubeTitle / Description / Privacy | | used at publish time |
| reviewTokenHash | string | SHA-256 of raw token, hidden |
| reviewTokenExpiresAt | date | |

## VideoVersions

project, versionNumber (unique per project), sourceType (upload\|gdrive),
url, driveUrl, cloudinaryPublicId, thumbnailUrl, durationSeconds,
originalFilename, notes, uploadedBy.

## Comments

project, version, author, authorEmail, authorName, timestampSeconds, body, resolved.

## Approvals

project, version, actor, actorEmail, actorRole, action
(approve \| request_changes \| submit_for_review \| publish), note.

## Notifications

user, email, type, title, body, project, read, emailSentAt.

## PublishingRecords

project, version, publishedBy, youtubeVideoId, youtubeUrl, title,
description, privacyStatus, status (pending\|uploading\|succeeded\|failed), error.
