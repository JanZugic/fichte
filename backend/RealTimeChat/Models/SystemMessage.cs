using System;
using System.Collections.Generic;

namespace RealTimeChat.Models;

public partial class SystemMessage
{
    public int Id { get; set; }

    public int RoomId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime SentAt { get; set; }
}
