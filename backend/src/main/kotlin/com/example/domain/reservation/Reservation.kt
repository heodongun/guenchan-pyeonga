package com.example.domain.reservation

import com.example.domain.event.Events
import com.example.domain.user.Users
import com.example.util.LocalDateTimeSerializer
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Reservations : LongIdTable("reservations") {
    val eventId = reference("event_id", Events)
    val userId = reference("user_id", Users).nullable()
    val status = varchar("status", 50).default("confirmed") // pending, confirmed, cancelled
    val participantName = varchar("participant_name", 100)
    val participantEmail = varchar("participant_email", 255)
    val participantPhone = varchar("participant_phone", 50).nullable()
    val notes = text("notes").nullable()
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
    val updatedAt = datetime("updated_at").defaultExpression(CurrentDateTime)
}

@Serializable
data class Reservation(
    val id: Long,
    val eventId: Long,
    val userId: Long?,
    val status: String,
    val participantName: String,
    val participantEmail: String,
    val participantPhone: String?,
    val notes: String?,
    @Serializable(with = LocalDateTimeSerializer::class)
    val createdAt: LocalDateTime,
    @Serializable(with = LocalDateTimeSerializer::class)
    val updatedAt: LocalDateTime
)

@Serializable
data class CreateReservationRequest(
    val eventId: Long,
    val participantName: String,
    val participantEmail: String,
    val participantPhone: String? = null,
    val notes: String = ""
)

@Serializable
data class UpdateReservationStatusRequest(
    val status: String // confirmed, cancelled
)
