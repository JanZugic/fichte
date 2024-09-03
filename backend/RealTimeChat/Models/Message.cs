using System;
using System.Collections.Generic;

namespace RealTimeChat.Models;

public partial class Message
{
    public int MessageId { get; set; }

    public int RoomId { get; set; }

    public int SenderId { get; set; }

    public string MessageType { get; set; } = null!;

    public string? Content { get; set; }

    public byte[]? FileContent { get; set; }

    public DateTime? SentAt { get; set; }

    public virtual Room Room { get; set; } = null!;

    public virtual User Sender { get; set; } = null!;
}
