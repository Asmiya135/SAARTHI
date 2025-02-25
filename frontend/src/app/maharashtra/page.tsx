import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Globe } from "lucide-react"

const services = [
  "Property Registration",
  "Driving License",
  "Birth Certificate",
  "Death Certificate",
  "Income Certificate",
  "Caste Certificate",
]

const emergencyContacts = [
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Ambulance", number: "108" },
  { name: "Women Helpline", number: "1091" },
  { name: "Child Helpline", number: "1098" },
  { name: "Senior Citizen Helpline", number: "1090" },
]

export default function MaharashtraPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-[250px] p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <h1 className="text-2xl font-bold mb-6">Maharashtra Services</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Button key={service} variant="outline" className="justify-start">
                        <MapPin className="h-4 w-4 mr-2" />
                        {service}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emergencyContacts.map((contact) => (
                      <div key={contact.name} className="flex justify-between items-center">
                        <span>{contact.name}</span>
                        <Button variant="outline">
                          <Phone className="h-4 w-4 mr-2" />
                          {contact.number}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About Maharashtra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Maharashtra is a state in the western peninsular region of India occupying a substantial portion of
                  the Deccan Plateau. It is the second-most populous state and third-largest state by area in India.
                </p>
                <Button variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  Visit Official Website
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

